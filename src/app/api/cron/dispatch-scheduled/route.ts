import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/booking.model';
import User from '@/models/user.model';
import Vehicle from '@/models/vehicle.model';

export async function GET(req: NextRequest) {
  // Sécurité : vérifier le header Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const now = new Date();
  const dispatchWindow = new Date(now.getTime() + 15 * 60 * 1000); // +15 min

  // Trouver toutes les courses planifiées à dispatcher
  const bookings = await Booking.find({
    isScheduled: true,
    scheduledStatus: 'pending',
    scheduledAt: { $lte: dispatchWindow },
  });

  if (bookings.length === 0) {
    return NextResponse.json({ dispatched: 0 });
  }

  let dispatched = 0;

  for (const booking of bookings) {
    // Trouver un chauffeur disponible dans la même ville
    const driver = await User.findOne({
      roles: 'partner',
      isAvailable: true,
      isApproved: true,
    });

    if (!driver) {
      // Pas de chauffeur dispo — on laisse pending, réessai au prochain cron
      continue;
    }

    const vehicle = await Vehicle.findOne({
      owner: driver._id,
      isApproved: true,
    });

    if (!vehicle) continue;

    // Assigner le chauffeur
    booking.driver = driver._id;
    booking.vehicle = vehicle._id;
    booking.driverMobileNumber = driver.mobileNumber || '';
    booking.scheduledStatus = 'dispatching';
    booking.bookingStatus = 'confirmed';
    await booking.save();

    // Marquer chauffeur indisponible
    driver.isAvailable = false;
    await driver.save();

    dispatched++;
  }

  return NextResponse.json({ dispatched, total: bookings.length });
}