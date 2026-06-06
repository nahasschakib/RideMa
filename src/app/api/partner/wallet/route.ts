import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Wallet from "@/models/wallet.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const wallet = await Wallet.findOne({
      owner: session.user.id,
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
      { status: 500 },
    );
  }
}
