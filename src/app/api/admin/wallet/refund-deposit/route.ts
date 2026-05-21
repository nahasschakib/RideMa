import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
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

    const { driverId } = await req.json();
    if (!driverId) {
      return NextResponse.json({ message: "driverId manquant" }, { status: 400 });
    }

    const wallet = await Wallet.findOne({ owner: driverId, ownerType: "driver" });
    if (!wallet) {
      return NextResponse.json({ message: "Wallet introuvable" }, { status: 404 });
    }

    if (wallet.balance < 0) {
      return NextResponse.json(
        { code: "DEBT_EXISTS", message: "Le conducteur a une dette en cours. Régularisez avant le remboursement." },
        { status: 400 }
      );
    }

    const activeBooking = await Booking.findOne({
      driver: driverId,
      bookingStatus: { $in: ["confirmed", "started"] },
    });
    if (activeBooking) {
      return NextResponse.json(
        { code: "ACTIVE_BOOKING", message: "Le conducteur a un trajet actif en cours." },
        { status: 400 }
      );
    }

    const depositAmount = wallet.deposit?.amount ?? 0;

    await Wallet.findOneAndUpdate(
      { owner: driverId, ownerType: "driver" },
      {
        $set: {
          "deposit.status": "refunded",
          "deposit.refundedAt": new Date(),
          isActive: false,
        },
      }
    );

    await DepositRequest.create({
      driver: driverId,
      depositCode: `REFUND-${Date.now()}`,
      amount: depositAmount,
      receiptDescription: "Remboursement caution conducteur",
      type: "refund",
      status: "pending",
    });

    return NextResponse.json({ success: true, refundAmount: depositAmount });
  } catch (error) {
    return NextResponse.json(
      { message: `refund-deposit error ${error}` },
      { status: 500 }
    );
  }
}
