import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function emitSocket(userId: string, event: string, data: object) {
  const url = `${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? "http://localhost:5000"}/emit`;
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

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  // App Router : req.arrayBuffer() donne le body brut, nécessaire pour la vérification HMAC
  const rawBody = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] signature invalide:", msg);
    return NextResponse.json({ message: `Webhook signature invalide: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Path: caution ou recharge wallet conducteur
    if (session.metadata?.type === "deposit" || session.metadata?.type === "topup") {
      const driverId = session.metadata.driverId;
      const amount = (session.amount_total ?? 0) / 100;
      await dbConnect();

      if (session.metadata.type === "deposit") {
        await Wallet.findOneAndUpdate(
          { owner: driverId, ownerType: "driver" },
          {
            $set: {
              "deposit.amount": amount,
              "deposit.status": "active",
              "deposit.paidAt": new Date(),
              isActive: true,
            },
          },
          { upsert: true }
        );
      } else {
        await Wallet.findOneAndUpdate(
          { owner: driverId, ownerType: "driver" },
          {
            $inc: { balance: amount },
            $set: { isActive: true },
            $push: {
              transactions: {
                type: "credit",
                amount,
                reason: "manual_deposit",
                description: `Recharge wallet ${amount} MAD`,
              },
            },
          },
          { upsert: true }
        );
      }

      await emitSocket(driverId, "wallet:restored", { amount });
      return NextResponse.json({ received: true });
    }

    // Path: paiement réservation (inchangé)
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return NextResponse.json({ received: true });

    await dbConnect();
    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ received: true });

    if (booking.bookingStatus !== "awaiting_payment") {
      console.warn("[stripe/webhook] ignoré — statut inattendu:", booking.bookingStatus);
      return NextResponse.json({ received: true });
    }

    const fare = booking.fare;
    const adminCommission = Math.round(fare * 0.1 * 100) / 100;
    const partnerAmount = Math.round(fare * 0.9 * 100) / 100;

    await Booking.findByIdAndUpdate(bookingId, {
      bookingStatus: "confirmed",
      paymentStatus: "paid",
      adminCommission,
      partnerAmount,
    });

    await Wallet.findOneAndUpdate(
      { owner: booking.driver, ownerType: "driver" },
      {
        $inc: { balance: partnerAmount },
        $push: {
          transactions: {
            type: "credit",
            amount: partnerAmount,
            reason: "trip_earning",
            bookingId: booking._id,
            description: `Trajet ${booking._id} - part conducteur`,
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
            bookingId: booking._id,
            description: `Commission 10% trajet ${booking._id}`,
          },
        },
      },
      { upsert: true }
    );
  }

  return NextResponse.json({ received: true });
}
