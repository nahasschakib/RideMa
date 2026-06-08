import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
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

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const booking = await Booking.findOne({ _id: id, driver: session.user.id });
    if (!booking || booking.bookingStatus !== "confirmed") {
      return NextResponse.json(
        { message: "Réservation introuvable ou non confirmée" },
        { status: 400 }
      );
    }

    booking.bookingStatus = "started";
    await booking.save();

    await emitSocket(booking.user.toString(), "booking:started", {
      bookingId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: `start booking error ${error}` },
      { status: 500 }
    );
  }
}
