import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Vehicle from '@/models/vehicle.model';
import { uploadProfilePhoto } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const vehicle = await Vehicle.findOne({ owner: user._id });
    if (!vehicle) return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });

    const { baseFare, pricePerKM, waitingCharge, image } = await req.json();

    if (!baseFare || !pricePerKM) {
      return NextResponse.json({ error: 'Tarif de base et prix/km requis' }, { status: 400 });
    }

    vehicle.baseFare = Number(baseFare);
    vehicle.pricePerKM = Number(pricePerKM);
    if (waitingCharge) vehicle.waitingCharge = Number(waitingCharge);

    if (image?.base64 && image?.mimeType) {
      const dataUri = `data:${image.mimeType};base64,${image.base64}`;
      const imageUrl = await uploadProfilePhoto(dataUri, `vehicle_${vehicle._id}`);
      vehicle.imageUrl = imageUrl;
    }

    vehicle.status = 'pending';
    await vehicle.save();

    user.partnerOnBoardingSteps = 6;
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