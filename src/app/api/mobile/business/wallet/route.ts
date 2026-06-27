import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Company from '@/models/company.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    const company = await Company.findOne({ adminUser: user?._id });
    if (!company) return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });

    const { amount } = await req.json();
    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Montant minimum : 100 MAD' }, { status: 400 });
    }

    company.wallet.balance += amount;
    company.wallet.transactions.unshift({
      type: 'credit',
      amount,
      reason: 'topup',
      description: `Recharge entreprise — ${amount} MAD`,
    });
    await company.save();

    return NextResponse.json({
      success: true,
      balance: company.wallet.balance,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}