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
      return NextResponse.json({ balance: 0, transactions: [] });
    }

    const transactions = [...(wallet.transactions ?? [])]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

    return NextResponse.json({ balance: wallet.balance, transactions });
  } catch (error) {
    return NextResponse.json(
      { message: `wallet error ${error}` },
      { status: 500 },
    );
  }
}
