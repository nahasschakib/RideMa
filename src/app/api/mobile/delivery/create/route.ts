import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Delivery from '@/models/delivery.model';
import DeliveryZone from '@/models/deliveryZone.model';

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const {
      senderName, senderPhone,
      pickUpAddress, pickUpLocation,
      recipientName, recipientPhone,
      dropAddress, dropLocation,
      description, weightCategory, weightKg,
      isFragile, notes, zoneId, paymentMethod,
    } = await req.json();

    if (!senderName || !senderPhone || !pickUpAddress || !pickUpLocation ||
        !recipientName || !recipientPhone || !dropAddress || !dropLocation ||
        !description || !weightCategory || !zoneId) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const zone = await DeliveryZone.findById(zoneId);
    if (!zone) return NextResponse.json({ error: 'Zone introuvable' }, { status: 404 });

    const weightSurcharge = zone.weightPrices[weightCategory as keyof typeof zone.weightPrices] ?? 0;
    const totalPrice = zone.basePrice + weightSurcharge;

    const delivery = await Delivery.create({
      client: user._id,
      senderName, senderPhone,
      pickUpAddress,
      pickUpLocation: { type: 'Point', coordinates: pickUpLocation },
      recipientName, recipientPhone,
      dropAddress,
      dropLocation: { type: 'Point', coordinates: dropLocation },
      description, weightCategory,
      weightKg: weightKg ?? null,
      isFragile: isFragile ?? false,
      notes: notes ?? null,
      zone: zone.name,
      basePrice: zone.basePrice,
      weightSurcharge,
      totalPrice,
      paymentMethod: paymentMethod ?? 'cash',
      pickupCode: generateCode(),
      deliveryCode: generateCode(),
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error('Create delivery error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}