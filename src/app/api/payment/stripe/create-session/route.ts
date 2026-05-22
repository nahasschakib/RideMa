import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY manquant dans .env.local");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await req.json();
    const booking = await Booking.findOne({ _id: bookingId, user: session.user.id });

    if (!booking || booking.bookingStatus !== "awaiting_payment") {
      return NextResponse.json({ message: "Réservation introuvable ou statut invalide" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: process.env.STRIPE_CURRENCY ?? "mad",
            unit_amount: Math.round(booking.fare * 100),
            product_data: {
              name: "Trajet RideMa",
              description: `${booking.pickUpAddress} → ${booking.dropAddress}`,
            },
          },
        },
      ],
      success_url: `${baseUrl}/user/payment/success?session_id={CHECKOUT_SESSION_ID}&bookingId=${bookingId}`,
      cancel_url:  `${baseUrl}/user/payment/cancel?bookingId=${bookingId}`,
      metadata: { bookingId: bookingId.toString() },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const msg = error instanceof Stripe.errors.StripeError
      ? `Stripe [${error.code}]: ${error.message}`
      : String(error);
    console.error("[stripe/create-session]", msg);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
