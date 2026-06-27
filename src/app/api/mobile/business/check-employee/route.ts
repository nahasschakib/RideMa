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

    const employee = await CompanyEmployee.findOne({ user: user._id, isActive: true });
    if (!employee) return NextResponse.json({ isEmployee: false });

    const company = await Company.findById(employee.company);
    if (!company || company.status !== 'active') return NextResponse.json({ isEmployee: false });

    const remaining = employee.monthlyLimit
      ? employee.monthlyLimit - employee.currentMonthSpend
      : null;

    return NextResponse.json({
      isEmployee: true,
      companyName: company.name,
      companyBalance: company.wallet.balance,
      monthlyLimit: employee.monthlyLimit ?? null,
      currentSpend: employee.currentMonthSpend,
      remaining,
    });
  } catch (error) {
    return NextResponse.json({ isEmployee: false });
  }
}