import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));
  const bookingId = params.bookingId || params.oid;
  
  return NextResponse.redirect(`https://ride-ma.vercel.app/user/payment/cmi-success?bookingId=${bookingId}`);
}