import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import axios from "axios";
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
      paymentMethod,
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

    // Si un booking en attente de paiement ou en cours de recherche existe, le retourner
    const pending = await Booking.findOne({
      user: session.user.id,
      bookingStatus: { $in: ["requested", "awaiting_payment"] },
    });
    if (pending) {
      return NextResponse.json(pending);
    }

    // Si un trajet déjà confirmé ou démarré existe, bloquer la nouvelle réservation
    const activeTrip = await Booking.findOne({
      user: session.user.id,
      bookingStatus: { $in: ["confirmed", "started"] },
    });
    if (activeTrip) {
      return NextResponse.json(
        { message: "Vous avez déjà un trajet actif en cours. Annulez-le avant d'en créer un nouveau.", bookingStatus: activeTrip.bookingStatus },
        { status: 409 }
      );
    }

    // Vérifier le wallet du conducteur
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
      user:               session.user.id,
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

    // Notifier le conducteur
    await axios.post(socketUrl, {
      userId: driverId,
      event: "new-booking",
      data: { bookingId: booking._id, pickUpAddress, dropAddress, fare },
    }).catch(() => console.warn("[socket] Driver notification failed"));

    // Si cash : notifier le client immédiatement que c'est confirmé
    if (isCash) {
      await axios.post(socketUrl, {
        userId: session.user.id,
        event: "accept_booking",
        data: "confirmed",
      }).catch(() => console.warn("[socket] Client notification failed"));
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[booking/create]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
