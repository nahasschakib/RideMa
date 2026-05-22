import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

const EXPIRY_MS: Record<string, number> = {
  requested:        15  * 60 * 1000,  // 15 min sans acceptation conducteur
  awaiting_payment: 10  * 60 * 1000,  // 10 min sans confirmation paiement
  confirmed:        120 * 60 * 1000,  // 2h sans démarrage
  started:          480 * 60 * 1000,  // 8h max pour un trajet
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect()
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ booking: null })
        }
        const user = await User.findOne({ email: session.user.email })
        const booking = await Booking.findOne({
            user: user.id,
            bookingStatus: { $in: ["requested", "awaiting_payment", "confirmed", "started"] }
        })
        if (!booking) {
            return NextResponse.json({ booking: null })
        }

        const limit = EXPIRY_MS[booking.bookingStatus]
        const age   = booking.updatedAt
            ? Date.now() - new Date(booking.updatedAt).getTime()
            : Infinity

        if (limit !== undefined && age > limit) {
            await Booking.updateOne({ _id: booking._id }, { $set: { bookingStatus: "expired" } })
            return NextResponse.json({ booking: null })
        }

        return NextResponse.json({ booking })
    } catch (error) {
        return NextResponse.json(
            { message: `get active booking error ${error}` },
            { status: 500 }
        )
    }
}
