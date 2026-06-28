import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Wallet from '@/models/wallet.model';
import WithdrawalRequest from '@/models/withdrawalRequest.model';
import PartnerBank from '@/models/partnerBank.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { amount } = await req.json();

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Montant minimum de retrait : 100 MAD' }, { status: 400 });
    }

    const wallet = await Wallet.findOne({ owner: user._id, ownerType: 'driver' });
    if (!wallet) return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 });
    if (!wallet.isActive) return NextResponse.json({ error: 'Wallet inactif' }, { status: 400 });

    // Solde disponible = balance - walletMinimum
    const available = wallet.balance - (wallet.walletMinimum ?? 100);
    if (amount > available) {
      return NextResponse.json({
        error: `Solde disponible pour retrait : ${available.toFixed(0)} MAD (minimum ${wallet.walletMinimum} MAD conservé)`,
      }, { status: 400 });
    }

    // Vérifier pas de retrait en attente
    const pending = await WithdrawalRequest.findOne({ driver: user._id, status: 'pending' });
    if (pending) {
      return NextResponse.json({ error: 'Vous avez déjà une demande de retrait en attente' }, { status: 400 });
    }

    // Récupérer les infos bancaires
    const bank = await PartnerBank.findOne({ owner: user._id });
    if (!bank) {
      return NextResponse.json({ error: 'Informations bancaires manquantes' }, { status: 400 });
    }

    const withdrawal = await WithdrawalRequest.create({
      driver: user._id,
      amount,
      bankDetails: {
        accountHolder: bank.accountHolderName,
        accountNumber: bank.accountNumber,
        ribiban: bank.ribiban,
      },
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const withdrawals = await WithdrawalRequest.find({ driver: user._id })
      .sort({ createdAt: -1 });

    return NextResponse.json(withdrawals);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}