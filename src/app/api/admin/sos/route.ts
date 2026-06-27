import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SOSAlert from "@/models/sosAlert.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const alerts = await SOSAlert.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}