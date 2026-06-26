import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Delivery from '@/models/delivery.model';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const { id } = await context.params;

    const delivery = await Delivery.findById(id)
      .populate('deliverer', 'name mobileNumber photoUrl averageRating');

    if (!delivery) return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });

    return NextResponse.json(delivery);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}