import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import City from '@/models/city.model';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const { id } = await context.params;
    const body = await req.json();
    const city = await City.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(city);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}