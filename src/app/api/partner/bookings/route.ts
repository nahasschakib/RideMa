import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import "@/models/vehicle.model";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const driver = await User.findOne({ email });
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }
    const bookings = await Booking.find({ driver: driver._id })
      .populate("user driver vehicle")
      .sort({ createdAt: -1 });
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Error fetching bookings: ${error}` },
      { status: 500 }
    );
  }
}