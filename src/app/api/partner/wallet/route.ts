import dbConnect from "@/lib/db";
import Wallet from "@/models/wallet.model";
import User from "@/models/user.model";
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
    const wallet = await Wallet.findOne({
      owner: user._id,
      ownerType: "driver",
    }).lean();
    if (!wallet) {
      return NextResponse.json({
        balance: 0,
        transactions: [],
        deposit: { amount: 0, status: "none" },
        depositThreshold: 500,
        walletMinimum: 100,
        isActive: false,
      });
    }
    const transactions = [...(wallet.transactions ?? [])]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    return NextResponse.json({
      balance: wallet.balance,
      transactions,
      deposit: wallet.deposit,
      depositThreshold: wallet.depositThreshold,
      walletMinimum: wallet.walletMinimum,
      isActive: wallet.isActive,
    });
  } catch (error) {
    return NextResponse.json(
      { message: `wallet error ${error}` },
      { status: 500 }
    );
  }
}