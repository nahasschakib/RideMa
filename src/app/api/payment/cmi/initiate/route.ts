import {getEmailFromRequest} from "@/lib/mobile-auth";

import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/user.model";

function cmiHash(params: Record<string, string>, storeKey: string): string {
  // Tri alphabétique des clés, concaténation key=value| puis HMAC-SHA256 + Base64
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("|");
  return crypto.createHmac("sha256", storeKey).update(sorted).digest("base64");
}

export async function POST(req: NextRequest) {
   console.log('[cmi/initiate] called');
  try {
    await dbConnect();
   const email = await getEmailFromRequest(req)
     console.log('[cmi/initiate] email:', email);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({email})

    const { bookingId } = await req.json();
    const booking = await Booking.findOne({ _id: bookingId, user:user.id });

    if (!booking || !["awaiting_payment", "requested"].includes(booking.bookingStatus)) {
  return NextResponse.json({ message: "Réservation introuvable ou statut invalide" }, { status: 400 });
}
    // MODE MOCK — à supprimer quand les vraies clés CMI sont disponibles
if (!process.env.CMI_MERCHANT_ID || process.env.CMI_MERCHANT_ID === 'ton_merchant_id') {
  return NextResponse.json({
    gatewayUrl: 'https://ride-ma.vercel.app/user/payment/cmi-success',
    params: { bookingId: bookingId.toString() },
  });
}

   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ride-ma.vercel.app';
const merchantId = process.env.CMI_MERCHANT_ID ?? 'MOCK_MERCHANT';
const storeKey   = process.env.CMI_STORE_KEY ?? 'MOCK_KEY';
    const rnd        = Date.now().toString();

    const params: Record<string, string> = {
      clientid:      merchantId,
      amount:        booking.fare.toFixed(2),
      currency:      "504",           // MAD
      oid:           bookingId.toString(),
      okUrl:         `${baseUrl}/user/payment/cmi-success?bookingId=${bookingId}`,
      failUrl:       `${baseUrl}/user/payment/cancel?bookingId=${bookingId}`,
      callbackUrl:   `${baseUrl}/api/payment/cmi/callback`,
      storetype:     "3D_PAY_HOSTING",
      trantype:      "Auth",
      rnd,
      lang:          "fr",
      encoding:      "UTF-8",
      hashAlgorithm: "ver3",
    };

    params.HASH = cmiHash(params, storeKey);

    return NextResponse.json({
      gatewayUrl: process.env.CMI_GATEWAY_URL ?? "https://testpayment.cmi.co.ma/fim/est3Dgate",
      params,
    });
  } catch (error) {
    console.error("[cmi/initiate]", error);
    return NextResponse.json({ message: "Erreur initialisation CMI" }, { status: 500 });
  }
}
