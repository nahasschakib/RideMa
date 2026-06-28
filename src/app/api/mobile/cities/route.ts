import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import City from '@/models/city.model';

export async function GET() {
  try {
    await dbConnect();
    const cities = await City.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(cities);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}