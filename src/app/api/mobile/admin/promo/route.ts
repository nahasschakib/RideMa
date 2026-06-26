import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import PromoCode from '@/models/promoCode.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const admin = await User.findOne({ email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const promos = await PromoCode.find().sort({ createdAt: -1 });
    return NextResponse.json(promos);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const admin = await User.findOne({ email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const { code, description, discountType, discountValue, maxDiscount, minOrderAmount, target, maxUses, expiresAt } = body;

    if (!code || !description || !discountType || !discountValue || !maxUses) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const existing = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existing) return NextResponse.json({ error: 'Code déjà existant' }, { status: 400 });

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      target: target ?? 'both',
      maxUses: Number(maxUses),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}