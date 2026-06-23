import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/user.model";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Configuration serveur manquante" },
        { status: 500 }
      );
    }
    const roles = user.roles?.length ? user.roles :[user.role]
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        roles,
        name: user.name,
      },
      secret,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        _id:user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        roles
      },
    });
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}