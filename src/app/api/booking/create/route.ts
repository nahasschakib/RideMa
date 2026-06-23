import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await User.findOne({ email });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const {
      driverId, vehicleId, pickUpAddress, dropAddress,
      pickUpLocation, dropLocation, fare, mobileNumber, paymentMethod,
    } = await req.json();

    if (!driverId || !vehicleId || !pickUpLocation?.coordinates?.length ||
        !dropLocation?.coordinates?.length || !fare || !mobileNumber) {
      return NextResponse.json({ message: "Missing required booking details" }, { status: 400 });
    }
    console.log('[booking/create] driverId:', driverId)
    const driver = await User.findById(driverId);
    console.log('[booking/create] driver found:',!!driver)
       if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }

    const pending = await Booking.findOne({
      user: currentUser._id,
      bookingStatus: { $in: ["requested", "awaiting_payment"] },
    });
    if (pending) return NextResponse.json(pending);

    const activeTrip = await Booking.findOne({
      user: currentUser._id,
      bookingStatus: { $in: ["confirmed", "started"] },
    });
    if (activeTrip) {
      return NextResponse.json(
        { message: "Vous avez déjà un trajet actif en cours.", bookingStatus: activeTrip.bookingStatus },
        { status: 409 }
      );
    }

    const wallet = await Wallet.findOne({ owner: driverId, ownerType: "driver" });
    const skipDepositCheck = process.env.SKIP_DEPOSIT_CHECK === "true";
    if (!skipDepositCheck) {
      if (!wallet || wallet.deposit.status !== "active" || !wallet.isActive) {
        return NextResponse.json(
          { message: "Ce conducteur n'est pas disponible pour le moment." },
          { status: 403 }
        );
      }
    }

    const isCash = (paymentMethod ?? "cash") === "cash";

    const booking = await Booking.create({
      user:               currentUser._id,
      driver,
      vehicle:            vehicleId,
      pickUpAddress,
      dropAddress,
      pickUpLocation,
      dropLocation,
      fare,
      userMobileNumber:   mobileNumber,
      driverMobileNumber: driver.mobileNumber ?? "",
      bookingStatus:      isCash ? "confirmed" : "requested",
      paymentMethod:      paymentMethod ?? "cash",
      paymentStatus:      isCash ? "cash" : "pending",
    });

    const socketUrl = `${process.env.SOCKET_SERVER_URL ?? "http://localhost:8000"}/emit`;

    await axios.post(socketUrl, {
      userId: driverId,
      event: "new-booking",
      data: { bookingId: booking._id, pickUpAddress, dropAddress, fare },
    }).catch(() => console.warn("[socket] Driver notification failed"));

    const { sendPushNotification } = await import("@/lib/push-notifications");
    await sendPushNotification(
      driverId,
      "🚗 Nouvelle course !",
      `${pickUpAddress} → ${dropAddress} — ${fare} MAD`,
      { bookingId: booking._id.toString() }
    );

    if (isCash) {
      await axios.post(socketUrl, {
        userId: currentUser._id.toString(),
        event: "accept_booking",
        data: "confirmed",
      }).catch(() => console.warn("[socket] Client notification failed"));
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[booking/create]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}