import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import User from "@/models/user.model";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    await dbConnect();

    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const skipDepositCheck = process.env.SKIP_DEPOSIT_CHECK === "true";
    if (!skipDepositCheck) {
      const wallet = await Wallet.findOne({
        owner: user._id,
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
     const { sendPushNotification } = await import("@/lib/push-notifications");
    await sendPushNotification(
      booking.user.toString(),
      "✅ Course acceptée !",
      "Votre chauffeur est en route vers vous.",
      { bookingId: booking._id.toString() }
    );

    return NextResponse.json({ success: "true" }, { status: 200 });
  } catch (error) {
    console.error("[accept] error:", error);
    return NextResponse.json(
      { message: `accept booking error: ${error}` },
      { status: 500 }
    );
  }
}