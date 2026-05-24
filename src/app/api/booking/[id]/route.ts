import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const booking = await Booking.findOne({ _id: id, user: session.user.id }).lean();
    if (!booking) {
      return NextResponse.json({ message: "Introuvable" }, { status: 404 });
    }

    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(booking.vehicle).lean(),
      User.findById(booking.driver).select("name email").lean(),
    ]);

    return NextResponse.json({
      booking: {
        _id:                booking._id,
        pickUpAddress:      booking.pickUpAddress,
        dropAddress:        booking.dropAddress,
        pickUpLocation:     booking.pickUpLocation,
        dropLocation:       booking.dropLocation,
        fare:               booking.fare,
        bookingStatus:      booking.bookingStatus,
        paymentStatus:      booking.paymentStatus,
        vehicleType:        vehicle?.type ?? null,
        driverName:         (driver as { name?: string } | null)?.name ?? null,
        driverMobileNumber: booking.driverMobileNumber ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: `get booking error ${error}` },
      { status: 500 }
    );
  }
}
