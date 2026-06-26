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
    const admin = await User.findOne({ email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'pending';

    const partners = await User.find({
      role: 'partner',
      partnerStatus: status,
      ...(status === 'pending' ? { partnerOnBoardingSteps: { $gte: 3 } } : {}),
    }).select('name email partnerStatus partnerOnBoardingSteps createdAt').sort({ createdAt: -1 });

    const partnerIds = partners.map(p => p._id);
    const vehicles = await Vehicle.find({ owner: { $in: partnerIds } }).select('owner type model');
    const vehicleMap = new Map(vehicles.map(v => [String(v.owner), v]));

    const result = partners.map(p => ({
      _id: p._id,
      name: p.name,
      email: p.email,
      partnerStatus: p.partnerStatus,
      partnerOnBoardingSteps: p.partnerOnBoardingSteps,
      createdAt: p.createdAt,
      vehicle: vehicleMap.get(String(p._id)) ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}