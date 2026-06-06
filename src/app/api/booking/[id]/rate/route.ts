import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { score, comment } = await req.json();
  if (!score || score < 1 || score > 5)
    return NextResponse.json({ error: "Note invalide (1–5)" }, { status: 400 });

  await dbConnect();
  const { id } = await context.params;

  const booking = await Booking.findOne({
    _id: id,
    user: session.user.id,
    bookingStatus: "completed",
  });

  if (!booking)
    return NextResponse.json({ error: "Réservation introuvable ou non terminée" }, { status: 404 });

  if (booking.rating?.score !== null && booking.rating?.score !== undefined)
    return NextResponse.json({ error: "Déjà noté" }, { status: 409 });

  booking.rating = { score, comment: comment?.trim() ?? "", ratedAt: new Date() };
  await booking.save();

  // Mettre à jour la note moyenne du conducteur
  const allRatings = await Booking.find({
    driver: booking.driver,
    "rating.score": { $ne: null },
  }).select("rating.score");

  const avg =
    allRatings.reduce((sum, b) => sum + (b.rating?.score ?? 0), 0) /
    allRatings.length;

  await User.findByIdAndUpdate(booking.driver, {
    averageRating: Math.round(avg * 10) / 10,
  });

  return NextResponse.json({ success: true });
}
