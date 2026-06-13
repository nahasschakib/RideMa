import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

async function emitSocket(userId: string, event: string, data: object) {
  const url = `${process.env.SOCKET_SERVER_URL ?? "http://localhost:8000"}/emit`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, event, data }),
    });
  } catch {}
}

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

    const driver = await User.findOne({ email });
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }

    const booking = await Booking.findOne({ _id: id, driver: driver._id });
    if (!booking || booking.bookingStatus !== "confirmed") {
      return NextResponse.json(
        { message: "Réservation introuvable ou non confirmée" },
        { status: 400 }
      );
    }

    booking.bookingStatus = "started";
    await booking.save();

    await emitSocket(booking.user.toString(), "booking:started", { bookingId: id });
     const { sendPushNotification } = await import("@/lib/push-notifications");
    await sendPushNotification(
      booking.user.toString(),
      "🛣️ Course démarrée !",
      "Votre chauffeur a validé le départ. Bon trajet !",
      { bookingId: id }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: `start booking error ${error}` },
      { status: 500 }
    );
  }
}