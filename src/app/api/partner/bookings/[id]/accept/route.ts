import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    const wallet = await Wallet.findOne({
      owner: session.user.id,
      ownerType: "driver",
    });

    if (!wallet || wallet.deposit.status !== "active") {
      return NextResponse.json(
        {
          code: "DEPOSIT_REQUIRED",
          message: "Versez votre caution de 500 MAD pour activer votre compte.",
        },
        { status: 403 }
      );
    }

    if (!wallet.isActive) {
      return NextResponse.json(
        {
          code: "WALLET_SUSPENDED",
          message: "Solde insuffisant. Rechargez votre wallet pour continuer.",
        },
        { status: 403 }
      );
    }

    const booking = await Booking.findById(id);
    console.log("booking status:", booking?.bookingStatus);

    if (!booking || booking.bookingStatus !== "requested") {
      return NextResponse.json({ message: "invalid" }, { status: 400 });
    }

    booking.bookingStatus = "awaiting_payment";
    booking.paymentDeadline = new Date(Date.now() + 5 * 60 * 1000);
    await booking.save();

    return NextResponse.json({ success: "true" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `accept booking error ${error}` },
      { status: 500 }
    );
  }
}
