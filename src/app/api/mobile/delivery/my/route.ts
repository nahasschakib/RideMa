import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Delivery from '@/models/delivery.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const deliveries = await Delivery.find({ client: user._id })
      .sort({ createdAt: -1 })
      .populate('deliverer', 'name mobileNumber photoUrl');

    return NextResponse.json(deliveries);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}