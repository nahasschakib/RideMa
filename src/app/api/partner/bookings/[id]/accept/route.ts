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
    console.log("[accept] bookingId:", id);

    await dbConnect();
    console.log("[accept] DB connected");

    const session = await auth();
    console.log("[accept] session userId:", session?.user?.id ?? "NONE");
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const skipDepositCheck = process.env.SKIP_DEPOSIT_CHECK === "true";
    console.log("[accept] skipDepositCheck:", skipDepositCheck);

    if (!skipDepositCheck) {
      const wallet = await Wallet.findOne({
        owner: session.user.id,
        ownerType: "driver",
      });
      console.log("[accept] wallet:", wallet ? `found, deposit=${wallet.deposit?.status}, isActive=${wallet.isActive}` : "NOT FOUND");

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
    console.log("[accept] booking found:", booking ? "YES" : "NO");
    console.log("[accept] booking status:", booking?.bookingStatus);
    console.log("[accept] booking.user:", booking?.user);

    if (!booking || booking.bookingStatus !== "requested") {
      return NextResponse.json({ message: "invalid" }, { status: 400 });
    }

    booking.bookingStatus = "awaiting_payment";
    booking.paymentDeadline = new Date(Date.now() + 5 * 60 * 1000);
    await booking.save();
    console.log("[accept] booking saved OK");

    const socketUrl = `${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? "http://localhost:8000"}/emit`;
    console.log("[accept] calling socket:", socketUrl, "for userId:", booking.user?.toString());
    await axios.post(socketUrl, {
      userId: booking.user.toString(),
      event: "accept_booking",
      data: booking.bookingStatus,
    });
    console.log("[accept] socket emit OK");

    return NextResponse.json({ success: "true" }, { status: 200 });
  } catch (error) {
    console.error("[accept] FULL ERROR:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return NextResponse.json(
      { message: `accept booking error: ${error}` },
      { status: 500 }
    );
  }
}
