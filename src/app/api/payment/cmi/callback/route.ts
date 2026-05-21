import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function cmiHash(params: Record<string, string>, storeKey: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("|");
  return crypto.createHmac("sha256", storeKey).update(sorted).digest("base64");
}

// CMI envoie un POST form-encoded en server-to-server
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const raw = Object.fromEntries(new URLSearchParams(body)) as Record<string, string>;

    const receivedHash = raw.HASH;
    const { HASH: _removed, ...paramsWithoutHash } = raw;
    void _removed;

    const storeKey = process.env.CMI_STORE_KEY!;
    const expectedHash = cmiHash(paramsWithoutHash, storeKey);

    if (receivedHash !== expectedHash) {
      console.error("[cmi/callback] HASH invalide");
      return new NextResponse("HASH_MISMATCH", { status: 400 });
    }

    // ProcReturnCode "00" = paiement approuvé
    if (raw.ProcReturnCode === "00" && raw.mdStatus === "1") {
      const bookingId = raw.oid;
      await dbConnect();
      const booking = await Booking.findById(bookingId);

      if (booking && booking.bookingStatus === "awaiting_payment") {
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
    }

    // CMI attend "ACTION=POSTAUTH" en réponse pour valider le paiement
    return new NextResponse("ACTION=POSTAUTH", {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[cmi/callback]", error);
    return new NextResponse("ERROR", { status: 500 });
  }
}
