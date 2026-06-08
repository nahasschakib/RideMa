import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;

    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const skipDepositCheck = process.env.SKIP_DEPOSIT_CHECK === "true";

    if (!skipDepositCheck) {
      const wallet = await Wallet.findOne({
        owner: session.user.id,
        ownerType: "driver",
      });

      if (!wallet || wallet.deposit.status !== "active") {
        return NextResponse.json(
          { code: "DEPOSIT_REQUIRED", message: "Caution requise." },
          { status: 403 }
        );
      }

      if (!wallet.isActive) {
        return NextResponse.json(
          { code: "WALLET_SUSPENDED", message: "Wallet suspendu." },
          { status: 403 }
        );
      }
    }

    const booking = await Booking.findById(id);

    if (!booking || booking.bookingStatus !== "requested") {
      return NextResponse.json({ message: "invalid" }, { status: 400 });
    }

    booking.bookingStatus = "awaiting_payment";
    booking.paymentDeadline = new Date(Date.now() + 5 * 60 * 1000);
    await booking.save();

    const socketUrl = `${process.env.SOCKET_SERVER_URL ?? "http://localhost:8000"}/emit`;
    await axios.post(socketUrl, {
      userId: booking.user.toString(),
      event: "accept_booking",
      data: booking.bookingStatus,
    });

    return NextResponse.json({ success: "true" }, { status: 200 });
  } catch (error) {
    console.error("[accept] error:", error);
    return NextResponse.json(
      { message: `accept booking error: ${error}` },
      { status: 500 }
    );
  }
}
