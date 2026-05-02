import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      driverId,
      vehicleId,
      pickUpAddress,
      dropAddress,
      pickUpLocation,
      dropLocation,
      fare,
      mobileNumber,
    } = await req.json();

    if (
      !driverId ||
      !vehicleId ||
      !pickUpLocation?.coordinates?.length ||
      !dropLocation?.coordinates?.length ||
      !fare ||
      !mobileNumber
    ) {
      return NextResponse.json(
        { message: "Missing required booking details" },
        { status: 400 }
      );
    }

    const driver = await User.findById(driverId);
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }

    const existing = await Booking.findOne({
      user: session.user.id,
      bookingStatus: { $in: ["requested", "awaiting_payment", "confirmed", "started"] },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const booking = await Booking.create({
      user:              session.user.id,
      driver,
      vehicle:           vehicleId,
      pickUpAddress,
      dropAddress,
      pickUpLocation,
      dropLocation,
      fare,
      userMobileNumber:  mobileNumber,
      driverMobileNumber: driver.mobileNumber ?? "",
      bookingStatus:     "requested",
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[booking/create]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
