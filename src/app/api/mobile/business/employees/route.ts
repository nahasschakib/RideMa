import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Company from '@/models/company.model';
import CompanyEmployee from '@/models/companyEmployee.model';

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const admin = await User.findOne({ email });
    if (!admin) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const company = await Company.findOne({ adminUser: admin._id });
    if (!company) return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    if (company.status !== 'active') {
      return NextResponse.json({ error: 'Entreprise non activée' }, { status: 400 });
    }

    const { employeeEmail, monthlyLimit, department } = await req.json();

    const employee = await User.findOne({ email: employeeEmail });
    if (!employee) {
      return NextResponse.json({ error: 'Utilisateur introuvable — il doit avoir un compte MaRide' }, { status: 404 });
    }

    const existing = await CompanyEmployee.findOne({ company: company._id, user: employee._id });
    if (existing) {
      return NextResponse.json({ error: 'Employé déjà ajouté' }, { status: 400 });
    }

    const companyEmployee = await CompanyEmployee.create({
      company: company._id,
      user: employee._id,
      monthlyLimit: monthlyLimit ?? company.monthlyLimit,
      department,
    });

    company.employeeCount += 1;
    await company.save();

    return NextResponse.json(companyEmployee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const admin = await User.findOne({ email });
    const company = await Company.findOne({ adminUser: admin?._id });
    if (!company) return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });

    const { employeeId } = await req.json();
    await CompanyEmployee.findByIdAndUpdate(employeeId, { isActive: false });
    company.employeeCount = Math.max(0, company.employeeCount - 1);
    await company.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}