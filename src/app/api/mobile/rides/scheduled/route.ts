import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Booking from '@/models/booking.model';

export async function GET(req: NextRequest) {
  await dbConnect();
  const email = await getEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const bookings = await Booking.find({
    user: user._id,
    isScheduled: true,
    scheduledStatus: 'pending',
    scheduledAt: { $gte: new Date() },
  }).sort({ scheduledAt: 1 });

  return NextResponse.json({ bookings });
}