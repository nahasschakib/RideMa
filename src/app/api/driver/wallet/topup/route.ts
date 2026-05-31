import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import DepositRequest from "@/models/depositRequest.model";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, method } = await req.json();
    if (!amount || !method || !["cmi", "virement"].includes(method)) {
      return NextResponse.json({ message: "Paramètres invalides" }, { status: 400 });
    }

    if (method === "cmi") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: process.env.STRIPE_CURRENCY ?? "mad",
              unit_amount: Math.round(amount * 100),
              product_data: {
                name: "Recharge wallet MaRide",
                description: `Recharge wallet conducteur — ${amount} MAD`,
              },
            },
          },
        ],
        success_url: `${baseUrl}/partner/dashboard?topup=success`,
        cancel_url: `${baseUrl}/partner/dashboard?topup=cancel`,
        metadata: { type: "topup", driverId: session.user.id },
      });
      return NextResponse.json({ url: checkoutSession.url });
    }

    // Virement : demande manuelle en attente
    await DepositRequest.create({
      driver: session.user.id,
      depositCode: `TOP-${Date.now()}`,
      amount,
      receiptDescription: "Virement bancaire recharge wallet",
      type: "topup",
      status: "pending",
    });

    return NextResponse.json(
      { success: true, message: "Demande de recharge créée, en attente de validation admin." },
      { status: 201 }
    );
  } catch (error) {
    const msg =
      error instanceof Stripe.errors.StripeError
        ? `Stripe [${error.code}]: ${error.message}`
        : String(error);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
