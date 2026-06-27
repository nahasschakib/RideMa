import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Delivery from "@/models/delivery.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const deliveries = await Delivery.find()
      .populate('deliverer', 'name mobileNumber')
      .sort({ createdAt: -1 });
    return NextResponse.json(deliveries);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}