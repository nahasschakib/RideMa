import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import DepositRequest from "@/models/depositRequest.model";
import Wallet from "@/models/wallet.model";
import { NextRequest, NextResponse } from "next/server";

async function emitSocket(userId: string, event: string, data: object) {
  const url = `${process.env.SOCKET_SERVER_URL ?? "http://localhost:8000"}/emit`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, event, data }),
    });
  } catch {
    // socket server indisponible — non bloquant
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { driverId, depositCode, amount } = await req.json();
    if (!driverId || !depositCode || !amount) {
      return NextResponse.json({ message: "Paramètres manquants" }, { status: 400 });
    }

    const depositRequest = await DepositRequest.findOne({
      driver: driverId,
      depositCode,
      status: "pending",
    });
    if (!depositRequest) {
      return NextResponse.json(
        { message: "Demande de dépôt introuvable ou déjà traitée" },
        { status: 404 }
      );
    }

    await DepositRequest.findByIdAndUpdate(depositRequest._id, {
      status: "validated",
      validatedBy: session.user.id,
      validatedAt: new Date(),
    });

    if (depositRequest.type === "caution") {
      await Wallet.findOneAndUpdate(
        { owner: driverId, ownerType: "driver" },
        {
          $set: {
            "deposit.amount": amount,
            "deposit.status": "active",
            "deposit.paidAt": new Date(),
            isActive: true,
          },
        },
        { upsert: true }
      );
    } else if (depositRequest.type === "topup") {
      await Wallet.findOneAndUpdate(
        { owner: driverId, ownerType: "driver" },
        {
          $inc: { balance: amount },
          $set: { isActive: true },
          $push: {
            transactions: {
              type: "credit",
              amount,
              reason: "manual_deposit",
              description: `Recharge virement validée par admin — ${amount} MAD`,
            },
          },
        },
        { upsert: true }
      );
    }

    // Créditer wallet admin
    await Wallet.findOneAndUpdate(
      { ownerType: "admin" },
      {
        $setOnInsert: { isActive: true },
        $inc: { balance: amount },
        $push: {
          transactions: {
            type: "credit",
            amount,
            reason: "manual_deposit",
            description: `Dépôt validé conducteur ${driverId} — code ${depositCode}`,
          },
        },
      },
      { upsert: true }
    );

    await emitSocket(driverId, "wallet:restored", { amount, type: depositRequest.type });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: `validate-deposit error ${error}` },
      { status: 500 }
    );
  }
}
