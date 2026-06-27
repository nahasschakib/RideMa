import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import { sendPushNotification } from '@/lib/push-notifications';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { latitude, longitude, bookingId, role } = await req.json();

    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const title = '🚨 ALERTE SOS MaRide';
    const body = `${role === 'partner' ? 'Chauffeur' : 'Client'} ${user.name} a déclenché un SOS\n📍 ${mapsLink}\n📱 ${user.mobileNumber ?? 'N/A'}`;

    // Notifier tous les admins
    const admins = await User.find({ role: 'admin' });
    await Promise.all(
      admins.map(admin =>
        sendPushNotification(String(admin._id), title, body, { bookingId, type: 'sos' })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SOS error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}