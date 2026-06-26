import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import PartnerDocs from '@/models/partnerDocs.model';
import PartnerBank from '@/models/partnerBank.model';

export async function POST(
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
    const { action, rejectionReason } = await req.json();

    const partner = await User.findById(id);
    if (!partner || partner.role !== 'partner') {
      return NextResponse.json({ error: 'Partenaire introuvable' }, { status: 404 });
    }

    if (action === 'approve') {
      const docs = await PartnerDocs.findOne({ owner: id });
      const bank = await PartnerBank.findOne({ owner: id });
      if (!docs || !bank) {
        return NextResponse.json({ error: 'Dossier incomplet' }, { status: 400 });
      }
      partner.partnerStatus = 'approved';
      partner.videoKycStatus = 'pending';
      partner.partnerOnBoardingSteps = 4;
      await partner.save();
      docs.status = 'approved';
      await docs.save();
      bank.status = 'verified';
      await bank.save();
      return NextResponse.json({ message: 'Partenaire approuvé' });
    }

    if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Motif de rejet requis' }, { status: 400 });
      }
      partner.partnerStatus = 'rejected';
      partner.rejectionReason = rejectionReason;
      await partner.save();
      return NextResponse.json({ message: 'Partenaire rejeté' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}