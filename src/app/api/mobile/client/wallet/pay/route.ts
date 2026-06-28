import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Wallet from '@/models/wallet.model';
import Booking from '@/models/booking.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { bookingId } = await req.json();

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    if (String(booking.user) !== String(user._id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const partnerAmount = booking.partnerAmount;
    const adminCommission = booking.adminCommission;

    // 1. Débiter wallet client
    const clientWallet = await Wallet.findOne({ owner: user._id, ownerType: 'client' });
    if (!clientWallet) return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 });
    if (clientWallet.balance < booking.fare) {
      return NextResponse.json({
        error: `Solde insuffisant. Solde : ${clientWallet.balance} MAD, requis : ${booking.fare} MAD`,
      }, { status: 400 });
    }

    clientWallet.balance -= booking.fare;
    clientWallet.transactions.unshift({
      type: 'debit',
      amount: booking.fare,
      reason: 'payment',
      description: `Paiement course — ${booking.pickUpAddress} → ${booking.dropAddress}`,
      bookingId: booking._id,
    });
    await clientWallet.save();

    // 2. Créditer wallet chauffeur (90%)
    const driverWallet = await Wallet.findOne({ owner: booking.driver, ownerType: 'driver' });
    if (driverWallet) {
      driverWallet.balance += partnerAmount;
      driverWallet.transactions.unshift({
        type: 'credit',
        amount: partnerAmount,
        reason: 'trip_earning',
        description: `Course wallet client — ${booking.pickUpAddress} → ${booking.dropAddress}`,
        bookingId: booking._id,
      });
      await driverWallet.save();
    }

    // 3. Créditer wallet admin (10%)
    const adminWallet = await Wallet.findOne({ ownerType: 'admin' });
    if (adminWallet) {
      adminWallet.balance += adminCommission;
      adminWallet.transactions.unshift({
        type: 'credit',
        amount: adminCommission,
        reason: 'commission',
        description: `Commission course wallet — ${user.name}`,
        bookingId: booking._id,
      });
      await adminWallet.save();
    }

    // 4. Marquer booking comme payé
    booking.paymentStatus = 'paid';
    await booking.save();

    return NextResponse.json({
      success: true,
      balance: clientWallet.balance,
      message: 'Paiement effectué avec succès',
    });
  } catch (error) {
    console.error('Wallet pay error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}