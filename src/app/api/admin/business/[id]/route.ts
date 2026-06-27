import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Company from '@/models/company.model';
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
    const { status, monthlyLimit } = await req.json();

    const company = await Company.findByIdAndUpdate(
      id,
      { ...(status && { status }), ...(monthlyLimit && { monthlyLimit }) },
      { new: true }
    );

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}