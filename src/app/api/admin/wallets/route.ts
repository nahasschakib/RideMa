import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Wallet from "@/models/wallet.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const wallets = await Wallet.find({ ownerType: 'client' })
      .populate('owner', 'name email mobileNumber')
      .sort({ balance: -1 });
    return NextResponse.json(wallets);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}