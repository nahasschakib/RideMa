import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import WithdrawalRequest from '@/models/withdrawalRequest.model';
import Wallet from '@/models/wallet.model';
import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/push-notifications';

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
    const { action, rejectionReason } = await req.json();

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Demande déjà traitée' }, { status: 400 });
    }

    if (action === 'approve') {
      const wallet = await Wallet.findOne({ owner: withdrawal.driver, ownerType: 'driver' });
      if (!wallet) return NextResponse.json({ error: 'Wallet introuvable' }, { status: 404 });

      if (wallet.balance < withdrawal.amount) {
        return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 });
      }

      // Débiter le wallet
      wallet.balance -= withdrawal.amount;
      wallet.transactions.unshift({
        type: 'debit',
        amount: withdrawal.amount,
        reason: 'manual_deposit',
        description: `Virement bancaire — ${withdrawal.amount} MAD vers ${withdrawal.bankDetails.ribiban}`,
      });
      await wallet.save();

      withdrawal.status = 'approved';
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // Notifier le chauffeur
      await sendPushNotification(
        String(withdrawal.driver),
        '✅ Virement approuvé',
        `Votre demande de ${withdrawal.amount} MAD a été approuvée. Virement en cours.`,
        { type: 'withdrawal_approved' }
      );

      return NextResponse.json({ success: true, message: 'Virement approuvé' });
    }

    if (action === 'reject') {
      withdrawal.status = 'rejected';
      withdrawal.rejectionReason = rejectionReason ?? 'Demande rejetée';
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      await sendPushNotification(
        String(withdrawal.driver),
        '❌ Virement refusé',
        `Votre demande de ${withdrawal.amount} MAD a été refusée. Motif : ${rejectionReason ?? '—'}`,
        { type: 'withdrawal_rejected' }
      );

      return NextResponse.json({ success: true, message: 'Demande rejetée' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}