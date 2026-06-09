import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ message: "Token requis" }, { status: 400 });
    }
    await dbConnect();
    await User.findOneAndUpdate({ email }, { expoPushToken: token });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: `push token error ${error}` }, { status: 500 });
  }
}