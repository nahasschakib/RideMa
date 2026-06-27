import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Company from '@/models/company.model';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const companies = await Company.find()
      .populate('adminUser', 'name email mobileNumber')
      .sort({ createdAt: -1 });
    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}