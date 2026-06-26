import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import PromoCode from '@/models/promoCode.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { promoId } = await req.json();

    const promo = await PromoCode.findById(promoId);
    if (!promo) return NextResponse.json({ error: 'Code introuvable' }, { status: 404 });

    // Marquer comme utilisé
    promo.usedCount += 1;
    promo.usedBy.push(user._id);
    await promo.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}