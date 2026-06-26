import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Wallet from '@/models/wallet.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    let wallet = await Wallet.findOne({ owner: user._id, ownerType: 'client' });

    // Créer le wallet si inexistant
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

    return NextResponse.json(wallet);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}