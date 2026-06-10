import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { isOnline } = await req.json();
    const user = await User.findOneAndUpdate(
      { email },
      { isOnline },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    await Vehicle.findOneAndUpdate(
      { owner: user._id, status: "approved" },
      { isAvailable: isOnline }
    );
    return NextResponse.json({ success: true, isOnline });
  } catch (error) {
    return NextResponse.json({ message: `status error ${error}` }, { status: 500 });
  }
}