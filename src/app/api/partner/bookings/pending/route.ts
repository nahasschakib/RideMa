import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }
    const partner = await User.findOne({ email });
    if (!partner) {
      return NextResponse.json({ message: "partner not found" }, { status: 400 });
    }
    const bookings = await Booking.find({
      driver: partner._id,
      bookingStatus: "requested",
    });
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `fetch pending req error ${error}` }, { status: 500 });
  }
}