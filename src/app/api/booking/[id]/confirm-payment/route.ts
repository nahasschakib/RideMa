import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
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

    const { paymentMethod } = await req.json();
    if (paymentMethod !== "cash" && paymentMethod !== "online") {
      return NextResponse.json({ message: "Méthode de paiement invalide" }, { status: 400 });
    }

    const booking = await Booking.findOne({ _id: id, user: session.user.id });
    if (!booking || booking.bookingStatus !== "awaiting_payment") {
      return NextResponse.json({ message: "Réservation introuvable ou statut invalide" }, { status: 400 });
    }

    booking.bookingStatus = "confirmed";
    booking.paymentStatus = paymentMethod === "cash" ? "cash" : "pending";
    await booking.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: `confirm-payment error ${error}` },
      { status: 500 }
    );
  }
}
