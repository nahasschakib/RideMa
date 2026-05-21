import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Wallet from "@/models/wallet.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const wallet = await Wallet.findOne({
      owner: session.user.id,
      ownerType: "driver",
    });

    if (!wallet) {
      return NextResponse.json({
        depositStatus: "none",
        depositAmount: 0,
        balance: 0,
        isActive: false,
      });
    }

    return NextResponse.json({
      depositStatus: wallet.deposit?.status ?? "none",
      depositAmount: wallet.deposit?.amount ?? 0,
      balance: wallet.balance,
      isActive: wallet.isActive,
    });
  } catch (error) {
    return NextResponse.json(
      { message: `deposit-status error ${error}` },
      { status: 500 }
    );
  }
}
