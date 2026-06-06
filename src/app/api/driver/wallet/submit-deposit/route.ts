import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import DepositRequest from "@/models/depositRequest.model";
import Wallet from "@/models/wallet.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { depositCode, amount, receiptDescription } = await req.json();
    if (!depositCode || !amount || !receiptDescription) {
      return NextResponse.json({ message: "Paramètres manquants" }, { status: 400 });
    }

    const existing = await DepositRequest.findOne({
      driver: session.user.id,
      depositCode,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json(
        { message: "Ce code de dépôt est déjà en attente de validation" },
        { status: 409 }
      );
    }

    const depositRequest = await DepositRequest.create({
      driver: session.user.id,
      depositCode,
      amount,
      receiptDescription,
    });

    await Wallet.findOneAndUpdate(
      { owner: session.user.id, ownerType: "driver" },
      { "deposit.status": "pending", "deposit.amount": amount }
    );

    return NextResponse.json({ success: true, depositRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: `submit-deposit error ${error}` },
      { status: 500 }
    );
  }
}
