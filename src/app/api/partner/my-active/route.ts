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
    const user = await User.findOne({ email });
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const query = bookingId
      ? { _id: bookingId, driver: user._id }
      : { driver: user._id, bookingStatus: { $in: ["confirmed", "started"] } };
    const booking = await Booking.findOne(query)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("driver", "name")
      .populate("vehicle", "type model number");
    if (!booking) return NextResponse.json(null, { status: 200 });
    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `get active ride for partner error: ${error}` }, { status: 500 });
  }
}