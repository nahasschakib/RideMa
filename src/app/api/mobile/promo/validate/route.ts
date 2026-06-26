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

    const { code, orderAmount, target } = await req.json();

    if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 });

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo) return NextResponse.json({ error: 'Code invalide' }, { status: 404 });
    if (!promo.isActive) return NextResponse.json({ error: 'Code inactif' }, { status: 400 });
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return NextResponse.json({ error: 'Code expiré' }, { status: 400 });
    }
    if (promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ error: 'Code épuisé' }, { status: 400 });
    }
    if (promo.usedBy.map(String).includes(String(user._id))) {
      return NextResponse.json({ error: 'Code déjà utilisé par ce compte' }, { status: 400 });
    }
    if (promo.target !== 'both' && promo.target !== target) {
      return NextResponse.json({ error: `Code valable uniquement pour les ${promo.target === 'ride' ? 'courses' : 'livraisons'}` }, { status: 400 });
    }
    if (promo.minOrderAmount && orderAmount < promo.minOrderAmount) {
      return NextResponse.json({ error: `Montant minimum requis : ${promo.minOrderAmount} MAD` }, { status: 400 });
    }

    // Calculer la réduction
    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (orderAmount * promo.discountValue) / 100;
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    } else {
      discount = promo.discountValue;
    }
    discount = Math.min(discount, orderAmount);
    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      valid: true,
      promoId: promo._id,
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discount,
      finalAmount: Math.round((orderAmount - discount) * 100) / 100,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}