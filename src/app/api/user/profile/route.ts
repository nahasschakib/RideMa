import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const email = await getEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  await dbConnect();
  const user = await User.findOne({ email }).select("name email mobileNumber isEmailVerified createdAt averageRating");
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const email = await getEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { name, mobileNumber } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  await dbConnect();
  const user = await User.findOneAndUpdate(
    { email },
    { name: name.trim(), mobileNumber: mobileNumber?.trim() ?? "" },
    { new: true }
  ).select("name email mobileNumber isEmailVerified createdAt averageRating");
  return NextResponse.json(user);
}