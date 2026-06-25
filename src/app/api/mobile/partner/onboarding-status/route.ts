import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Vehicle from '@/models/vehicle.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const vehicle = await Vehicle.findOne({ owner: user._id });

    return NextResponse.json({
      partnerStatus: user.partnerStatus,
      partnerOnBoardingSteps: user.partnerOnBoardingSteps,
      rejectionReason: user.rejectionReason ?? null,
      vehicle: vehicle ? {
        type: vehicle.type,
        model: vehicle.model,
        number: vehicle.number,
        status: vehicle.status,
        rejectionReason: vehicle.rejectionReason ?? null,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}