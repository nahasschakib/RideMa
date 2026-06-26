import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Vehicle from '@/models/vehicle.model';

const VEHICLE_REGEX = /^\d{1,5}-[A-Z]{1,3}-\d{1,2}$/;

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { type, number, vehicleModel } = await req.json();

    if (!type || !vehicleModel || (type !== 'vélo' && !number)) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    if (type !== 'vélo' && !VEHICLE_REGEX.test(number?.toUpperCase())) {
      return NextResponse.json({ error: 'Numéro de véhicule invalide (ex: 12345-A-1)' }, { status: 400 });
    }

    const vehicleNumber = type !== 'vélo' ? number.toUpperCase() : null;

    if (vehicleNumber) {
      const existing = await Vehicle.findOne({ number: vehicleNumber });
      if (existing && String(existing.owner) !== String(user._id)) {
        return NextResponse.json({ error: 'Numéro déjà utilisé' }, { status: 400 });
      }
    }

    const existingVehicle = await Vehicle.findOne({ owner: user._id });

    if (existingVehicle) {
      existingVehicle.type = type;
      if (vehicleNumber) existingVehicle.number = vehicleNumber;
      existingVehicle.model = vehicleModel;
      existingVehicle.status = 'pending';
      await existingVehicle.save();
    } else {
      await Vehicle.create({
        owner: user._id,
        type,
        number: vehicleNumber ?? `VELO-${user._id}`,
        model: vehicleModel,
      });
    }

    user.partnerOnBoardingSteps = Math.max(user.partnerOnBoardingSteps, 1);
    user.role = 'partner';
    user.partnerStatus = 'pending';
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const vehicle = await Vehicle.findOne({ owner: user._id });
    return NextResponse.json(vehicle ?? null);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}