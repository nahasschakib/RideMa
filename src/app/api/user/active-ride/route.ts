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
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const booking = await Booking.findOne({
      user: user._id,
      bookingStatus: { $in: ["requested", "awaiting_payment", "confirmed", "started"] },
    })
      .sort({ createdAt: -1 })
      .populate("driver", "name mobileNumber")
      .populate("vehicle", "type model number");
    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `get active ride error: ${error}` }, { status: 500 });
  }
}