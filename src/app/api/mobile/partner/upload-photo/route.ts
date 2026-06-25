import { NextRequest, NextResponse } from 'next/server';
import { uploadProfilePhoto } from '@/lib/cloudinary';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import connectDB from '@/lib/db';
import User from '@/models/user.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { base64Image, mimeType } = await req.json();

    if (!base64Image || !mimeType) {
      return NextResponse.json({ error: 'Image manquante' }, { status: 400 });
    }

    const sizeInBytes = Buffer.byteLength(base64Image, 'base64');
    if (sizeInBytes > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 5MB)' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const dataUri = `data:${mimeType};base64,${base64Image}`;
    const photoUrl = await uploadProfilePhoto(dataUri, user._id.toString());

    user.photoUrl = photoUrl;
    await user.save();

    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}