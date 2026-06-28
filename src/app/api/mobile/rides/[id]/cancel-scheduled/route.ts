import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Booking from '@/models/booking.model';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const email = await getEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const booking = await Booking.findOne({
    _id: params.id,
    user: user._id,
    isScheduled: true,
    scheduledStatus: 'pending',
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  // Bloquer annulation si dispatch dans moins de 10 min
  const tenMinBefore = new Date(booking.scheduledAt.getTime() - 10 * 60 * 1000);
  if (new Date() >= tenMinBefore) {
    return NextResponse.json({ error: 'Annulation impossible — dispatch imminent' }, { status: 400 });
  }

  booking.scheduledStatus = 'cancelled';
  booking.bookingStatus = 'cancelled';
  await booking.save();

  return NextResponse.json({ success: true });
}