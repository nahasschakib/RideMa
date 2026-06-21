import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));
  const bookingId = params.bookingId || params.oid;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ride-ma.vercel.app';
  return NextResponse.redirect(`${baseUrl}/user/payment/cmi-success?bookingId=${bookingId}`);
}