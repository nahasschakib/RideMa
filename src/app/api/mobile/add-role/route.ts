import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { role } = await req.json();
    if (!["user", "partner"].includes(role)) {
      return NextResponse.json({ message: "Rôle invalide" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const currentRoles: string[] = user.roles?.length ? user.roles : [user.role];
    if (currentRoles.includes(role)) {
      return NextResponse.json({ message: "Rôle déjà actif", roles: currentRoles }, { status: 200 });
    }

    const newRoles = [...currentRoles, role];
    await User.findByIdAndUpdate(user._id, { roles: newRoles });

    return NextResponse.json({ message: "Rôle ajouté", roles: newRoles }, { status: 200 });
  } catch (error) {
    console.error("[add-role]", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}