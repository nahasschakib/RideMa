import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import PromoCode from "@/models/promoCode.model";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    await dbConnect();
    const { id } = await context.params;
    const body = await req.json();
    const promo = await PromoCode.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(promo);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    await dbConnect();
    const { id } = await context.params;
    await PromoCode.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}