import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.user.id).select("name email mobileNumber isEmailVerified createdAt");
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, mobileNumber } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });

  await dbConnect();
  const user = await User.findByIdAndUpdate(
    session.user.id,
    { name: name.trim(), mobileNumber: mobileNumber?.trim() ?? "" },
    { new: true }
  ).select("name email mobileNumber isEmailVerified createdAt");

  return NextResponse.json(user);
}
