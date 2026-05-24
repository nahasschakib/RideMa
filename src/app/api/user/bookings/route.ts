import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const session = await auth()
    if (!session || !session.user.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const bookings = await Booking.find({
      user: user._id
    }).populate("user driver vehicle")
      .sort({ createdAt: -1 })
    

    return NextResponse.json(bookings, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { message: `Error fetching bookings: ${error}` },
      { status: 500 }
    )
  }
}
