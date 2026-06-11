import { NextRequest, NextResponse } from "next/server";

import { getEmailFromRequest } from "@/lib/mobile-auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { score, comment } = await req.json();

    if (!score || score < 1 || score > 5) {
      return NextResponse.json(
        { error: "Note invalide (1-5)" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(params.id);

    if (!booking) {
      return NextResponse.json(
        { error: "Course introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien le client de cette course
    const currentUser = await User.findOne({ email });
    if (!currentUser || booking.user.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier que la course est terminée
    if (booking.bookingStatus !== "completed") {
      return NextResponse.json(
        { error: "La course n'est pas terminée" },
        { status: 400 }
      );
    }

    // Vérifier que la course n'est pas déjà notée
    if (booking.rating?.score !== null && booking.rating?.score !== undefined) {
      return NextResponse.json(
        { error: "Course déjà notée" },
        { status: 400 }
      );
    }

    // Enregistrer la note sur la course
    booking.rating = {
      score,
      comment: comment || "",
      ratedAt: new Date(),
    };
    await booking.save();

    // Mettre à jour la moyenne du driver
    const driver = await User.findById(booking.driver);
    if (driver) {
      const total = (driver.totalRatings || 0) + 1;
      const avg =
        ((driver.averageRating || 0) * (total - 1) + score) / total;
      driver.totalRatings = total;
      driver.averageRating = Math.round(avg * 10) / 10;
      await driver.save();
    }

    return NextResponse.json({ success: true, averageRating: driver?.averageRating });
  } catch (error) {
    console.error("Rate booking error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}