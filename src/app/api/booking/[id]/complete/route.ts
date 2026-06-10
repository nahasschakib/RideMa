import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import Wallet from "@/models/wallet.model";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

async function emitSocket(userId: string, event: string, data: object) {
  const url = `${process.env.SOCKET_SERVER_URL ?? "http://localhost:8000"}/emit`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, event, data }),
    });
  } catch {}
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    await dbConnect();

    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const driver = await User.findOne({ email });
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }

    const booking = await Booking.findOne({ _id: id, driver: driver._id });
    if (!booking || booking.bookingStatus !== "started") {
      return NextResponse.json(
        { message: "Réservation introuvable ou non démarrée" },
        { status: 400 }
      );
    }

    booking.bookingStatus = "completed";

    if (booking.paymentStatus === "cash") {
      const fare = booking.fare;
      const commission = Math.round(fare * 0.1 * 100) / 100;
      const partnerAmount = Math.round(fare * 0.9 * 100) / 100;

      booking.adminCommission = commission;
      booking.partnerAmount = partnerAmount;

      const driverId = driver._id.toString();

      const wallet = await Wallet.findOneAndUpdate(
        { owner: driver._id, ownerType: "driver" },
        {
          $inc: { balance: -commission },
          $push: {
            transactions: {
              type: "debit",
              amount: commission,
              reason: "commission_debit",
              bookingId: booking._id,
              description: `Commission 10% trajet cash ${booking._id}`,
            },
          },
        },
        { upsert: true, new: true }
      );

      if (wallet.balance < 0) {
        const deficit = Math.abs(wallet.balance);
        const newDepositAmount = Math.max(0, (wallet.deposit?.amount ?? 0) - deficit);
        wallet.balance = 0;
        wallet.deposit.amount = newDepositAmount;
        if (newDepositAmount < 100) {
          wallet.isActive = false;
          await wallet.save();
          await emitSocket(driverId, "wallet:blocked", {
            message: "Caution insuffisante. Rechargez votre compte pour continuer.",
            depositAmount: newDepositAmount,
          });
        } else {
          await wallet.save();
        }
      } else if (wallet.balance < (wallet.walletMinimum ?? 100)) {
        await emitSocket(driverId, "wallet:low_balance", {
          balance: wallet.balance,
          message: "Solde faible. Pensez à recharger votre wallet.",
        });
      }

      await Wallet.findOneAndUpdate(
        { ownerType: "admin" },
        {
          $setOnInsert: { isActive: true },
          $inc: { balance: commission },
          $push: {
            transactions: {
              type: "credit",
              amount: commission,
              reason: "commission",
              bookingId: booking._id,
              description: `Commission cash 10% trajet ${booking._id}`,
            },
          },
        },
        { upsert: true }
      );
    }

    await booking.save();

    await emitSocket(booking.user.toString(), "booking:completed", { bookingId: id });

   const updatedDriver = await User.findById(driver._id);
    const driverIsOnline = updatedDriver?.isOnline ?? false;
    await Vehicle.findOneAndUpdate(
   { owner: driver._id, status: "approved" },
   { isAvailable: driverIsOnline }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: `complete booking error ${error}` },
      { status: 500 }
    );
  }
}