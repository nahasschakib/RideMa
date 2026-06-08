import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function getDriverEmail(req: NextRequest): Promise<string | null> {
  // Essayer JWT Bearer d'abord
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      return payload.email as string;
    } catch {
      return null;
    }
  }
  // Sinon session NextAuth
  const session = await auth();
  return session?.user?.email ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const email = await getDriverEmail(req);
    if (!email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    await dbConnect();

    const driver = await User.findOne({ email });
    if (!driver) {
      return NextResponse.json({ message: "Driver introuvable" }, { status: 404 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const bookings = await Booking.find({
      driver: driver._id,
      paymentStatus: { $in: ["paid", "cash"] },
      createdAt: { $gte: sevenDaysAgo },
    }).select("partnerAmount createdAt").sort({ createdAt: 1 });

    const earningMap: Record<string, number> = {};
    bookings.forEach((b) => {
      const date = new Date(b.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      });
      if (!earningMap[date]) earningMap[date] = 0;
      earningMap[date] += b.partnerAmount || 0;
    });

    const earnings = Object.entries(earningMap).map(([date, earnings]) => ({
      date,
      earnings,
    }));

    return NextResponse.json(earnings, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch partner earnings", error },
      { status: 500 }
    );
  }
}