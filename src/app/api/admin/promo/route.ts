import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import PromoCode from "@/models/promoCode.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    return NextResponse.json(promos);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    const promo = await PromoCode.create({ ...body, code: body.code.toUpperCase() });
    return NextResponse.json(promo, { status: 201 });
  }  catch (error) {
  const err = error as { code?: number };
  if (err.code === 11000) return NextResponse.json({ error: 'Code déjà existant' }, { status: 400 });
  return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}