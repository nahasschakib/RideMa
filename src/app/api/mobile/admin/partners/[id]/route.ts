import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Vehicle from '@/models/vehicle.model';
import PartnerDocs from '@/models/partnerDocs.model';
import PartnerBank from '@/models/partnerBank.model';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const admin = await User.findOne({ email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await context.params;
    const partner = await User.findById(id).select('-password -otp');
    if (!partner) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const [vehicle, documents, bank] = await Promise.all([
      Vehicle.findOne({ owner: id }),
      PartnerDocs.findOne({ owner: id }),
      PartnerBank.findOne({ owner: id }),
    ]);

    return NextResponse.json({ partner, vehicle, documents, bank });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}