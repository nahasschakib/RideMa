import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Company from '@/models/company.model';
import CompanyEmployee from '@/models/companyEmployee.model';
import Booking from '@/models/booking.model';
import Wallet from '@/models/wallet.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { bookingId, companyId } = await req.json();

    // Vérifier que l'employé est lié à une entreprise active
    const query = companyId
      ? { user: user._id, company: companyId, isActive: true }
      : { user: user._id, isActive: true };
    const employee = await CompanyEmployee.findOne(query);
    if (!employee) {
      return NextResponse.json({ error: 'Vous n\'êtes pas lié à une entreprise' }, { status: 400 });
    }

    const company = await Company.findById(employee.company);
    if (!company || company.status !== 'active') {
      return NextResponse.json({ error: 'Entreprise inactive' }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    if (String(booking.user) !== String(user._id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const fare = booking.fare;
    const partnerAmount = booking.partnerAmount;
    const adminCommission = booking.adminCommission;

    // Vérifier plafond employé
    if (employee.monthlyLimit) {
      const remaining = employee.monthlyLimit - employee.currentMonthSpend;
      if (fare > remaining) {
        return NextResponse.json({
          error: `Plafond mensuel dépassé. Reste : ${remaining.toFixed(0)} MAD, requis : ${fare} MAD`,
        }, { status: 400 });
      }
    }

    // Vérifier solde wallet entreprise
    if (company.wallet.balance < fare) {
      return NextResponse.json({
        error: `Solde entreprise insuffisant. Solde : ${company.wallet.balance.toFixed(0)} MAD, requis : ${fare} MAD`,
      }, { status: 400 });
    }

    // 1. Débiter wallet entreprise
    company.wallet.balance -= fare;
    company.wallet.transactions.unshift({
      type: 'debit',
      amount: fare,
      reason: 'ride_payment',
      description: `Course employé ${user.name} — ${booking.pickUpAddress} → ${booking.dropAddress}`,
    });
    company.currentMonthSpend += fare;
    await company.save();

    // 2. Mettre à jour dépenses employé
    employee.currentMonthSpend += fare;
    await employee.save();

    // 3. Créditer wallet chauffeur (90%)
    const driverWallet = await Wallet.findOne({ owner: booking.driver, ownerType: 'driver' });
    if (driverWallet) {
      driverWallet.balance += partnerAmount;
      driverWallet.transactions.unshift({
        type: 'credit',
        amount: partnerAmount,
        reason: 'trip_earning',
        description: `Course Business (${company.name}) — ${booking.pickUpAddress} → ${booking.dropAddress}`,
        bookingId: booking._id,
      });
      await driverWallet.save();
    }

    // 4. Créditer wallet admin (10%)
    const adminWallet = await Wallet.findOne({ ownerType: 'admin' });
    if (adminWallet) {
      adminWallet.balance += adminCommission;
      adminWallet.transactions.unshift({
        type: 'credit',
        amount: adminCommission,
        reason: 'commission',
        description: `Commission Business (${company.name}) — ${user.name}`,
        bookingId: booking._id,
      });
      await adminWallet.save();
    }

    // 5. Marquer booking comme payé
    booking.paymentStatus = 'paid';
    await booking.save();

    return NextResponse.json({
      success: true,
      companyBalance: company.wallet.balance,
      employeeSpend: employee.currentMonthSpend,
      employeeLimit: employee.monthlyLimit,
      partnerAmount,
      adminCommission,
    });
  } catch (error) {
    console.error('Business pay error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}