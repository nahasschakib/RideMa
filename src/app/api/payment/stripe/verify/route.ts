import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    const bookingId = searchParams.get("bookingId");

    if (!sessionId || !bookingId) {
      return NextResponse.json({ message: "Paramètres manquants" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ message: "Paiement non complété" }, { status: 402 });
    }

    await dbConnect();

    // Mise à jour atomique : ne s'applique QUE si le booking est encore awaiting_payment.
    // Si le webhook a déjà confirmé la réservation, updated === null → on retourne 200 silencieusement.
    const fare_lookup = await Booking.findOne({ _id: bookingId, user: session.user.id });
    if (!fare_lookup) return NextResponse.json({ success: true });

    const adminCommission = Math.round(fare_lookup.fare * 0.1 * 100) / 100;
    const partnerAmount = Math.round(fare_lookup.fare * 0.9 * 100) / 100;

    const updated = await Booking.findOneAndUpdate(
      { _id: bookingId, 
        user: session.user.id, 
        bookingStatus: "awaiting_payment" },
      { bookingStatus: "confirmed", 
        paymentStatus: "paid", 
        adminCommission, 
        partnerAmount },
      { new: true }
    );

    // Webhook a déjà traité ce paiement → ignorer silencieusement
    if (!updated) return NextResponse.json({ success: true });

    await Wallet.findOneAndUpdate(
      { owner: updated.driver, ownerType: "driver" },
      {
        $inc: { balance: partnerAmount },
        $push: {
          transactions: {
            type: "credit",
            amount: partnerAmount,
            reason: "trip_earning",
            bookingId: updated._id,
            description: `Trajet ${updated._id} - part conducteur`,
          },
        },
      },
      { upsert: true }
    );

    await Wallet.findOneAndUpdate(
      { ownerType: "admin" },
      {
        $setOnInsert: { isActive: true },
        $inc: { balance: adminCommission },
        $push: {
          transactions: {
            type: "credit",
            amount: adminCommission,
            reason: "commission",
            bookingId: updated._id,
            description: `Commission 10% trajet ${updated._id}`,
          },
        },
      },
      { upsert: true }
    );

    await emitSocket(updated.driver.toString(), "wallet:trip_credited", {
      partnerAmount,
      bookingId: updated._id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stripe/verify]", error);
    return NextResponse.json({ message: "Erreur vérification Stripe" }, { status: 500 });
  }
}
