import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import { NextRequest, NextResponse } from "next/server";

// Vérification côté client après redirection okUrl CMI
// Le callback serveur-à-serveur est la source principale de mise à jour.
// Cette route vérifie juste que le booking a bien été confirmé par le callback.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    if (!bookingId) return NextResponse.json({ message: "bookingId manquant" }, { status: 400 });

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const booking = await Booking.findOne({ _id: bookingId, user: session.user.id });

    if (!booking) return NextResponse.json({ message: "Réservation introuvable" }, { status: 404 });

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ success: true });
    }

    // Le callback CMI peut prendre quelques secondes — on attend jusqu'à 10s
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const updated = await Booking.findById(bookingId);
      if (updated?.paymentStatus === "paid") return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Paiement non encore confirmé par CMI" }, { status: 402 });
  } catch (error) {
    console.error("[cmi/verify]", error);
    return NextResponse.json({ message: "Erreur vérification CMI" }, { status: 500 });
  }
}
