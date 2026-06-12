import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/models/chatMessages.model";
import { getEmailFromRequest } from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  try {
    const email = await getEmailFromRequest(request);
    if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { bookingId } = await request.json();
    if (!bookingId) return NextResponse.json({ message: "bookingId required" }, { status: 400 });

    const msgs = await ChatMessage.find({ bookingId }).sort({ createdAt: 1 });
    return NextResponse.json({ msgs }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `Error: ${error}` }, { status: 500 });
  }
}