import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import DepositRequest from "@/models/depositRequest.model";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  await dbConnect();

  const deposits = await DepositRequest.find({ status: "pending" })
    .populate("driver", "name email mobileNumber")
    .sort({ createdAt: -1 });

  return NextResponse.json(deposits);
}
