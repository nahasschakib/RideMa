import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DeliveryZone from '@/models/deliveryZone.model';
import { getEmailFromRequest } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const zones = await DeliveryZone.find({ isActive: true }).sort({ city: 1 });

    // Si aucune zone → seed par défaut pour Casablanca
    if (!zones.length) {
      const defaultZones = await DeliveryZone.insertMany([
        {
          name: 'Casablanca Centre',
          city: 'Casablanca',
          basePrice: 25,
          weightPrices: { light: 0, medium: 10, heavy: 25, extra_heavy: 50 },
        },
        {
          name: 'Casablanca Périphérie',
          city: 'Casablanca',
          basePrice: 35,
          weightPrices: { light: 0, medium: 10, heavy: 25, extra_heavy: 50 },
        },
        {
          name: 'Rabat',
          city: 'Rabat',
          basePrice: 60,
          weightPrices: { light: 5, medium: 15, heavy: 35, extra_heavy: 70 },
        },
        {
          name: 'Marrakech',
          city: 'Marrakech',
          basePrice: 80,
          weightPrices: { light: 5, medium: 20, heavy: 40, extra_heavy: 80 },
        },
      ]);
      return NextResponse.json(defaultZones);
    }

    return NextResponse.json(zones);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}