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

    const wallet = await Wallet.findOne({ owner: user._id, ownerType: 'client' });
    if (!wallet) return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 });

    if (wallet.balance < booking.fare) {
      return NextResponse.json({
        error: `Solde insuffisant. Solde : ${wallet.balance} MAD, requis : ${booking.fare} MAD`,
      }, { status: 400 });
    }

    wallet.balance -= booking.fare;
    wallet.transactions.unshift({
      type: 'debit',
      amount: booking.fare,
      reason: 'payment',
      description: `Paiement course — ${booking.pickUpAddress} → ${booking.dropAddress}`,
      bookingId: booking._id,
    });
    await wallet.save();

    booking.paymentStatus = 'paid';
    await booking.save();

    return NextResponse.json({
      success: true,
      balance: wallet.balance,
      message: 'Paiement effectué avec succès',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}