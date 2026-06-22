import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password, mobileNumber } = await req.json();

    if (!name || !email || !password || !mobileNumber) {
      return NextResponse.json({ message: "Tous les champs sont requis" }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ message: "Email déjà utilisé" }, { status: 409 });
    }

    // Générer OTP 6 chiffres
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Stocker OTP temporairement dans un champ pending
    await User.create({
                name,
                email: email.toLowerCase(),
                password,
                mobileNumber,
                role: "user",
                otp,
                otpExpiredAt: otpExpires,
                isEmailVerified: false,
                });

    // Envoyer OTP par email
    await sendMail(
      email,
      "Votre code de vérification MaRide",
      `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 16px;">
          <h2 style="color: #111; margin-bottom: 8px;">Bienvenue sur MaRide 🚗</h2>
          <p style="color: #6B7280;">Votre code de vérification est :</p>
          <div style="background: #F97316; color: #fff; font-size: 36px; font-weight: 900; text-align: center; padding: 24px; border-radius: 12px; letter-spacing: 8px; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #6B7280; font-size: 13px;">Ce code expire dans 10 minutes.</p>
        </div>
      `
    );

    return NextResponse.json({ message: "OTP envoyé", email }, { status: 200 });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}