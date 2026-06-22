import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ message: "Email et OTP requis" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ message: "Code incorrect" }, { status: 400 });
    }

    if (!user.otpExpiredAt || user.otpExpiredAt < new Date()) {
      return NextResponse.json({ message: "Code expiré" }, { status: 400 });
    }

    // Hash password et activer le compte
    const hashedPassword = await bcrypt.hash(user.password!, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      isEmailVerified: true,
      otp: null,
      otpExpiredAt: null,
    });

    // Générer JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      message: "Compte vérifié",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobileNumber: user.mobileNumber,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("[verify-otp]", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}