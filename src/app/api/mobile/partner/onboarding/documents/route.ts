import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import PartnerDocs from '@/models/partnerDocs.model';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function uploadBase64(base64: string, mimeType: string): Promise<string> {
  const dataUri = `data:${mimeType};base64,${base64}`;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(dataUri, { folder: 'partner-docs' }, (error, result) => {
      if (error || !result) return reject(error);
      resolve(result.secure_url);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { identity, drivingLicense, vehicleRegistration } = await req.json();

    if (!identity || !drivingLicense || !vehicleRegistration) {
      return NextResponse.json({ error: 'Tous les documents sont requis' }, { status: 400 });
    }

    const [cnieUrl, licenseUrl, fanUrl] = await Promise.all([
      uploadBase64(identity.base64, identity.mimeType),
      uploadBase64(drivingLicense.base64, drivingLicense.mimeType),
      uploadBase64(vehicleRegistration.base64, vehicleRegistration.mimeType),
    ]);

    await PartnerDocs.findOneAndUpdate(
      { owner: user._id },
      { $set: { cnieUrl, licenseUrl, fanUrl, status: 'pending' } },
      { upsert: true }
    );

    if (user.partnerOnBoardingSteps < 2) user.partnerOnBoardingSteps = 2;
    else user.partnerOnBoardingSteps = 3;
    user.partnerStatus = 'pending';
    await user.save();

    return NextResponse.json({ success: true, cnieUrl, licenseUrl, fanUrl });
  } catch (error) {
    console.error('Documents upload error:', error);
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

    const docs = await PartnerDocs.findOne({ owner: user._id });
    return NextResponse.json(docs ?? null);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}