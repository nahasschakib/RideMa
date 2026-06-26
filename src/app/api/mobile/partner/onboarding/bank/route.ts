import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import PartnerBank from '@/models/partnerBank.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { accountHolderName, accountNumber, ribiban, mobileNumber, mobilePaymentId } =
      await req.json();

    if (!accountHolderName || !accountNumber || !mobileNumber || !ribiban) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    await PartnerBank.findOneAndUpdate(
      { owner: user._id },
      {
        $set: {
          accountHolderName,
          accountNumber,
          ribiban: ribiban.toUpperCase(),
          mobilePaymentId: mobilePaymentId || null,
          status: 'added',
        },
      },
      { upsert: true }
    );

    user.mobileNumber = mobileNumber;
    user.partnerOnBoardingSteps = Math.max(user.partnerOnBoardingSteps, 3);
    user.partnerStatus = 'pending';
    user.role = 'partner';
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

    const bank = await PartnerBank.findOne({ owner: user._id });
    return NextResponse.json(bank ? { ...bank.toObject(), mobileNumber: user.mobileNumber ?? '' } : null);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}