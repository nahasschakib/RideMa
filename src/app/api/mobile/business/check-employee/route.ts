import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Company from '@/models/company.model';
import CompanyEmployee from '@/models/companyEmployee.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ isEmployee: false });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ isEmployee: false });

    const employees = await CompanyEmployee.find({ user: user._id, isActive: true });
    if (!employees.length) return NextResponse.json({ isEmployee: false });

    const companiesRaw = await Promise.all(
      employees.map(async (emp) => {
        const company = await Company.findById(emp.company);
        if (!company || company.status !== 'active') return null;
        const remaining = emp.monthlyLimit
          ? emp.monthlyLimit - emp.currentMonthSpend
          : null;
        return {
          companyId: company._id,
          companyName: company.name,
          companyBalance: company.wallet.balance,
          monthlyLimit: emp.monthlyLimit ?? null,
          currentSpend: emp.currentMonthSpend,
          remaining,
        };
      })
    );

    const activeCompanies = companiesRaw.filter(Boolean);
    if (!activeCompanies.length) return NextResponse.json({ isEmployee: false });

    return NextResponse.json({ isEmployee: true, companies: activeCompanies });
  } catch (error) {
    return NextResponse.json({ isEmployee: false });
  }
}