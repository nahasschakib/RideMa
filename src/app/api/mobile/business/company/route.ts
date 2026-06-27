import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Company from '@/models/company.model';
import CompanyEmployee from '@/models/companyEmployee.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    // Chercher si admin ou employé
    let company = await Company.findOne({ adminUser: user._id });
    let role = 'admin';

    if (!company) {
      const employee = await CompanyEmployee.findOne({ user: user._id, isActive: true });
      if (employee) {
        company = await Company.findById(employee.company);
        role = 'employee';
      }
    }

    if (!company) return NextResponse.json({ error: 'Aucune entreprise trouvée' }, { status: 404 });

    const employees = await CompanyEmployee.find({ company: company._id })
      .populate('user', 'name email mobileNumber');

    return NextResponse.json({ company, role, employees });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}