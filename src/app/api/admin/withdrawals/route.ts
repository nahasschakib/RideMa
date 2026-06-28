import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import WithdrawalRequest from '@/models/withdrawalRequest.model';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const withdrawals = await WithdrawalRequest.find()
      .populate('driver', 'name email mobileNumber')
      .sort({ createdAt: -1 });
    return NextResponse.json(withdrawals);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}