import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Booking from '@/models/booking.model';

export async function POST(req: NextRequest) {
  await dbConnect();
  const email = await getEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const {
    pickUpAddress, dropAddress,
    pickUpLocation, dropLocation,
    fare, userMobileNumber,
    paymentMethod, scheduledAt,
    companyId,
  } = body;

  if (!scheduledAt) return NextResponse.json({ error: 'scheduledAt required' }, { status: 400 });

  const scheduled = new Date(scheduledAt);
  const minTime = new Date(Date.now() + 30 * 60 * 1000); // min 30 min à l'avance
  if (scheduled < minTime) {
    return NextResponse.json({ error: 'La course doit être planifiée au moins 30 min à l\'avance' }, { status: 400 });
  }

  const booking = await Booking.create({
    user: user._id,
    driver: user._id, // placeholder — sera assigné au dispatch
    vehicle: user._id, // placeholder
    pickUpAddress,
    dropAddress,
    pickUpLocation,
    dropLocation,
    fare,
    userMobileNumber,
    driverMobileNumber: 'TBD',
    paymentMethod: paymentMethod || 'cash',
    paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    adminCommission: Math.round(fare * 0.1),
    partnerAmount: Math.round(fare * 0.9),
    pickUpOtp: '',
    pickUpOtpExpires: new Date(),
    dropOtp: '',
    dropOtpExpires: new Date(),
    bookingStatus: 'idle',
    isScheduled: true,
    scheduledAt: scheduled,
    scheduledStatus: 'pending',
    ...(companyId ? { company: companyId } : {}),
  });

  return NextResponse.json({ success: true, bookingId: booking._id });
}