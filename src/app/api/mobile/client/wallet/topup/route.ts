import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Wallet from '@/models/wallet.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { amount, method } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }
    if (amount < 10) {
      return NextResponse.json({ error: 'Montant minimum : 10 MAD' }, { status: 400 });
    }

    let wallet = await Wallet.findOne({ owner: user._id, ownerType: 'client' });
    if (!wallet) {
      wallet = await Wallet.create({
        owner: user._id,
        ownerType: 'client',
        balance: 0,
        transactions: [],
        isActive: true,
        deposit: { amount: 0, status: 'none' },
      });
    }

    wallet.balance += amount;
    wallet.transactions.unshift({
      type: 'credit',
      amount,
      reason: 'topup',
      description: `Recharge via ${method ?? 'CMI'} — ${amount} MAD`,
    });

    await wallet.save();

    return NextResponse.json({
      success: true,
      balance: wallet.balance,
      message: `${amount} MAD ajoutés à votre wallet`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}