import dbConnect from "@/lib/db";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest, NextResponse } from "next/server";

async function emitSocket(userId: string, event: string, data: object) {
  const url = `${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? "http://localhost:8000"}/emit`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, event, data }),
    });
  } catch {
    // socket server indisponible — non bloquant
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { bookingId, otp } = await req.json();
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Réservation introuvable" }, { status: 400 });
    }

    if (!booking.dropOtp) {
      return NextResponse.json({ message: "Le code OTP non généré" }, { status: 400 });
    }
    if (booking.dropOtp != otp) {
      return NextResponse.json({ message: "Le code OTP incorrect" }, { status: 400 });
    }
    if (booking.dropOtpExpires < new Date()) {
      return NextResponse.json({ message: "Le code OTP expiré" }, { status: 400 });
    }
    const isCash = booking.paymentStatus === "cash";

    booking.bookingStatus = "completed";
    booking.dropOtp = "";
    booking.dropOtpExpires = undefined;

    const fare = booking.fare;
    const adminCommission = Math.round(fare * 0.1 * 100) / 100;
    const partnerAmount = Math.round(fare * 0.9 * 100) / 100;
    booking.adminCommission = adminCommission;
    booking.partnerAmount = partnerAmount;

    if (isCash) {
      const driverId = booking.driver.toString();

      // Débit commission du wallet prépayé du conducteur
      const wallet = await Wallet.findOneAndUpdate(
        { owner: booking.driver, ownerType: "driver" },
        {
          $inc: { balance: -adminCommission },
          $push: {
            transactions: {
              type: "debit",
              amount: adminCommission,
              reason: "commission_debit",
              bookingId: booking._id,
              description: `Commission 10% trajet cash ${booking._id}`,
            },
          },
        },
        { upsert: true, new: true }
      );

      // Si wallet épuisé → puiser dans la caution
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

      // Créditer wallet admin
      await Wallet.findOneAndUpdate(
        { ownerType: "admin" },
        {
          $setOnInsert: { isActive: true },
          $inc: { balance: adminCommission },
          $push: {
            transactions: {
              type: "credit",
              amount: adminCommission,
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

    // Remettre le véhicule disponible
    await Vehicle.findOneAndUpdate(
      { owner: booking.driver, status: "approved" },
      { $set: { isAvailable: true } }
    );

    await emitSocket(booking.user.toString(), "booking:completed", { bookingId });

    return NextResponse.json({ message: "le code OTP de dépôt vérifié" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur de vérification du code OTP", error },
      { status: 500 }
    );
  }
}
