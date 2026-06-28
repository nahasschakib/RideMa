import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import City, { ICity } from '@/models/city.model';

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Coordonnées requises' }, { status: 400 });
    }

    const cities = await City.find({ isActive: true });

    // Seed villes si aucune n'existe
    if (!cities.length) {
      await City.insertMany([
        { name: 'Casablanca', nameAr: 'الدار البيضاء', coordinates: { lat: 33.5731, lng: -7.5898 }, radiusKm: 35, pricing: { baseFare: 8, pricePerKM: 3, waitingCharge: 1, minimumFare: 15 } },
        { name: 'Rabat',       nameAr: 'الرباط',        coordinates: { lat: 33.9716, lng: -6.8498 }, radiusKm: 25, pricing: { baseFare: 9, pricePerKM: 3.5, waitingCharge: 1.2, minimumFare: 16 } },
        { name: 'Marrakech',   nameAr: 'مراكش',         coordinates: { lat: 31.6295, lng: -7.9811 }, radiusKm: 30, pricing: { baseFare: 10, pricePerKM: 4, waitingCharge: 1.5, minimumFare: 18 } },
        { name: 'Fès',         nameAr: 'فاس',           coordinates: { lat: 34.0181, lng: -5.0078 }, radiusKm: 25, pricing: { baseFare: 8, pricePerKM: 3, waitingCharge: 1, minimumFare: 15 } },
        { name: 'Tanger',      nameAr: 'طنجة',          coordinates: { lat: 35.7595, lng: -5.8340 }, radiusKm: 25, pricing: { baseFare: 9, pricePerKM: 3.5, waitingCharge: 1.2, minimumFare: 16 } },
        { name: 'Agadir',      nameAr: 'أكادير',        coordinates: { lat: 30.4278, lng: -9.5981 }, radiusKm: 25, pricing: { baseFare: 9, pricePerKM: 3.5, waitingCharge: 1.2, minimumFare: 16 } },
        { name: 'Meknès',      nameAr: 'مكناس',         coordinates: { lat: 33.8935, lng: -5.5473 }, radiusKm: 20, pricing: { baseFare: 7, pricePerKM: 2.5, waitingCharge: 1, minimumFare: 13 } },
        { name: 'Oujda',       nameAr: 'وجدة',          coordinates: { lat: 34.6814, lng: -1.9086 }, radiusKm: 20, pricing: { baseFare: 7, pricePerKM: 2.5, waitingCharge: 1, minimumFare: 13 } },
        { name: 'Kénitra',     nameAr: 'القنيطرة',      coordinates: { lat: 34.2610, lng: -6.5802 }, radiusKm: 20, pricing: { baseFare: 7, pricePerKM: 2.8, waitingCharge: 1, minimumFare: 14 } },
        { name: 'Tétouan',     nameAr: 'تطوان',         coordinates: { lat: 35.5785, lng: -5.3684 }, radiusKm: 20, pricing: { baseFare: 8, pricePerKM: 3, waitingCharge: 1, minimumFare: 15 } },
      ]);
      const seeded = await City.find({ isActive: true });
      return detectCity(seeded, latitude, longitude);
    }

    return detectCity(cities, latitude, longitude);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function detectCity(cities: (ICity & { _id: unknown })[], latitude: number, longitude: number) {
  let nearest = null;
  let minDist = Infinity;

  for (const city of cities) {
    const dist = getDistanceKm(latitude, longitude, city.coordinates.lat, city.coordinates.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = { city, distance: dist };
    }
  }

  if (!nearest || minDist > nearest.city.radiusKm) {
    return NextResponse.json({
      detected: false,
      message: 'Ville non couverte par MaRide',
      nearest: nearest ? { name: nearest.city.name, distanceKm: Math.round(minDist) } : null,
    });
  }

  return NextResponse.json({
    detected: true,
    city: {
      _id: nearest.city._id,
      name: nearest.city.name,
      nameAr: nearest.city.nameAr,
      pricing: nearest.city.pricing,
      distanceKm: Math.round(minDist * 10) / 10,
    },
  });
}