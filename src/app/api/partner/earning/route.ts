import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function getDriverEmail(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      return payload.email as string;
    } catch { return null; }
  }
  const session = await auth();
  return session?.user?.email ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const email = await getDriverEmail(req);
    if (!email) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') ?? 'week'; // week | month | all

    await dbConnect();
    const driver = await User.findOne({ email });
    if (!driver) return NextResponse.json({ message: "Driver introuvable" }, { status: 404 });

    const now = new Date();
    let dateFilter: Date | null = null;
    if (period === 'week') {
      dateFilter = new Date();
      dateFilter.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      dateFilter = new Date();
      dateFilter.setMonth(now.getMonth() - 1);
    }

    const query: Record<string, unknown> =  {
      driver: driver._id,
      bookingStatus: 'completed',
      paymentStatus: { $in: ['paid', 'cash'] },
    };
    if (dateFilter) query.createdAt = { $gte: dateFilter };

    const bookings = await Booking.find(query)
      .select('partnerAmount fare createdAt pickUpAddress dropAddress paymentStatus')
      .sort({ createdAt: -1 });

    // Agrégation par jour pour le graphe
    const earningMap: Record<string, number> = {};
    bookings.forEach((b) => {
      const date = new Date(b.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short',
      });
      earningMap[date] = (earningMap[date] || 0) + (b.partnerAmount || 0);
    });

    const chartData = Object.entries(earningMap)
      .reverse()
      .map(([date, amount]) => ({ date, amount }));

    const totalGross = bookings.reduce((sum, b) => sum + (b.fare || 0), 0);
    const totalNet = bookings.reduce((sum, b) => sum + (b.partnerAmount || 0), 0);
    const totalCommission = totalGross - totalNet;

    return NextResponse.json({
      summary: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        count: bookings.length,
        period,
      },
      chartData,
      bookings: bookings.map(b => ({
        _id: b._id,
        createdAt: b.createdAt,
        fare: b.fare,
        partnerAmount: b.partnerAmount,
        commission: (b.fare || 0) - (b.partnerAmount || 0),
        pickUpAddress: b.pickUpAddress,
        dropAddress: b.dropAddress,
        paymentStatus: b.paymentStatus,
      })),
    });
  } catch (error) {
    return NextResponse.json({ message: "Erreur serveur", error }, { status: 500 });
  }
}