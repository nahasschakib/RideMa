import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/models/chatMessages.model";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  try {
    const email = await getEmailFromRequest(request);
    if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { bookingId, text, sender } = await request.json();
    if (!bookingId || !text || !sender || !["user", "driver"].includes(sender)) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    const msg = await ChatMessage.create({ bookingId, text, sender });
       try {
      const Booking = (await import("@/models/booking.model")).default;
      const booking = await Booking.findById(bookingId).select("user driver");
      if (booking) {
        const { sendPushNotification } = await import("@/lib/push-notifications");
        const recipientId = sender === "user"
          ? booking.driver.toString()
          : booking.user.toString();
        const senderLabel = sender === "user" ? "Client" : "Chauffeur";
        await sendPushNotification(
          recipientId,
          `💬 Message de ${senderLabel}`,
          text.length > 60 ? text.substring(0, 60) + "..." : text,
          { bookingId }
        );
      }
    } catch {}
    return NextResponse.json({ msg }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `Error: ${error}` }, { status: 500 });
  }
}