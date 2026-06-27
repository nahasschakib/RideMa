import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Company from '@/models/company.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { name, companyEmail, phone, address, ice, plan } = await req.json();

    if (!name || !companyEmail || !phone || !address || !ice) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const existing = await Company.findOne({ $or: [{ email: companyEmail }, { ice }] });
    if (existing) {
      return NextResponse.json({ error: 'Entreprise déjà enregistrée (email ou ICE)' }, { status: 400 });
    }

    const company = await Company.create({
      name,
      email: companyEmail,
      phone,
      address,
      ice,
      adminUser: user._id,
      plan: plan ?? 'prepaid',
      status: 'pending',
    });

    // Ajouter le rôle business_admin à l'utilisateur
    if (!user.roles?.includes('business_admin')) {
      user.roles = [...(user.roles ?? []), 'business_admin'];
      await user.save();
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Business register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}