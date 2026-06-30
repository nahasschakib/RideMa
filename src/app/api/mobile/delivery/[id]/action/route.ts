import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Delivery from '@/models/delivery.model';

const DRIVER_SHARE = 0.85;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { id } = await context.params;
    const { action, code, cancelReason, actualAmount, receiptPhoto } = await req.json();

    const delivery = await Delivery.findById(id);
    if (!delivery) return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });

    switch (action) {
      case 'accept':
        if (delivery.status !== 'requested') {
          return NextResponse.json({ error: 'Livraison déjà prise en charge' }, { status: 400 });
        }
        delivery.deliverer = user._id;
        delivery.status = 'confirmed';
        break;

      case 'pickup':
        if (String(delivery.deliverer) !== String(user._id)) {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }
        if (code !== delivery.pickupCode) {
          return NextResponse.json({ error: 'Code de récupération incorrect' }, { status: 400 });
        }
        delivery.status = 'picked_up';
        if (actualAmount) delivery.actualAmount = actualAmount;
        if (receiptPhoto) delivery.receiptPhoto = receiptPhoto;
        break;

      case 'transit':
        if (String(delivery.deliverer) !== String(user._id)) {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }
        delivery.status = 'in_transit';
        break;

      case 'deliver': {
        if (String(delivery.deliverer) !== String(user._id)) {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }
        if (code !== delivery.deliveryCode) {
          return NextResponse.json({ error: 'Code de livraison incorrect' }, { status: 400 });
        }

        delivery.status = 'delivered';
        delivery.paymentStatus = 'paid';

        const Wallet = (await import('@/models/wallet.model')).default;

        if (delivery.type === 'courses' || delivery.type === 'hanout') {
          // --- Flow Courses / Hanout ---
          if (actualAmount) delivery.actualAmount = actualAmount;
          if (receiptPhoto) delivery.receiptPhoto = receiptPhoto;

          const finalActual = delivery.actualAmount ?? delivery.estimatedAmount ?? 0;
          const finalTotal = finalActual + (delivery.totalFees ?? 0);

          // Driver = 85% des frais de service uniquement (pas du panier)
          const driverAmount = Math.round((delivery.totalFees ?? 0) * DRIVER_SHARE);
          const adminAmount = (delivery.totalFees ?? 0) - driverAmount;

          // Crédit driver
          const driverWallet = await Wallet.findOne({ owner: delivery.deliverer, ownerType: 'driver' });
          if (driverWallet) {
            driverWallet.balance += driverAmount;
            driverWallet.transactions.unshift({
              type: 'credit',
              amount: driverAmount,
              reason: 'trip_earning',
              description: `${delivery.type === 'hanout' ? 'Hanout' : 'Courses'} — ${delivery.pickUpAddress} → ${delivery.dropAddress}`,
              bookingId: delivery._id,
            });
            await driverWallet.save();
          }

          // Crédit admin
          const adminWallet = await Wallet.findOne({ ownerType: 'admin' });
          if (adminWallet) {
            adminWallet.balance += adminAmount;
            adminWallet.transactions.unshift({
              type: 'credit',
              amount: adminAmount,
              reason: 'commission',
              description: `Commission ${delivery.type} — ${delivery.pickUpAddress}`,
              bookingId: delivery._id,
            });
            await adminWallet.save();
          }

          // Règlement selon mode de paiement
          if (delivery.paymentMethod === 'wallet') {
            const clientWallet = await Wallet.findOne({ owner: delivery.client, ownerType: 'client' });
            if (clientWallet) {
              const reserved = delivery.reservedAmount ?? finalTotal;
              const refund = reserved - finalTotal;
              if (refund > 0) {
                clientWallet.balance += refund;
                clientWallet.transactions.unshift({
                  type: 'credit',
                  amount: refund,
                  reason: 'refund',
                  description: `Remboursement différence — ${delivery.type}`,
                  bookingId: delivery._id,
                });
              } else if (refund < 0) {
                const extra = Math.abs(refund);
                if (clientWallet.balance < extra) {
                  return NextResponse.json({ error: 'Solde insuffisant pour couvrir le dépassement' }, { status: 400 });
                }
                clientWallet.balance -= extra;
                clientWallet.transactions.unshift({
                  type: 'debit',
                  amount: extra,
                  reason: 'payment',
                  description: `Complément paiement — ${delivery.type}`,
                  bookingId: delivery._id,
                });
              }
              await clientWallet.save();
            }
          }
          // cash et cmi : règlement géré physiquement / déjà capturé, rien à faire ici

        } else {
          // --- Flow Colis (existant) ---
          if (delivery.paymentMethod === 'wallet') {
            const clientWallet = await Wallet.findOne({ owner: delivery.client, ownerType: 'client' });
            if (!clientWallet || clientWallet.balance < delivery.totalPrice) {
              return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 });
            }
            clientWallet.balance -= delivery.totalPrice;
            clientWallet.transactions.unshift({
              type: 'debit',
              amount: delivery.totalPrice,
              reason: 'payment',
              description: `Livraison colis — ${delivery.pickUpAddress} → ${delivery.dropAddress}`,
              bookingId: delivery._id,
            });
            await clientWallet.save();
          }

          const driverAmount = Math.round(delivery.totalPrice * DRIVER_SHARE);
          const adminAmount = delivery.totalPrice - driverAmount;

          const driverWallet = await Wallet.findOne({ owner: delivery.deliverer, ownerType: 'driver' });
          if (driverWallet) {
            driverWallet.balance += driverAmount;
            driverWallet.transactions.unshift({
              type: 'credit',
              amount: driverAmount,
              reason: 'trip_earning',
              description: `Livraison colis — ${delivery.pickUpAddress} → ${delivery.dropAddress}`,
              bookingId: delivery._id,
            });
            await driverWallet.save();
          }

          const adminWallet = await Wallet.findOne({ ownerType: 'admin' });
          if (adminWallet) {
            adminWallet.balance += adminAmount;
            adminWallet.transactions.unshift({
              type: 'credit',
              amount: adminAmount,
              reason: 'commission',
              description: `Commission livraison — ${delivery.pickUpAddress} → ${delivery.dropAddress}`,
              bookingId: delivery._id,
            });
            await adminWallet.save();
          }
        }
        break;
      }

      case 'cancel':
        delivery.status = 'cancelled';
        delivery.cancelReason = cancelReason ?? 'Annulé par le livreur';
        break;

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    await delivery.save();
    return NextResponse.json(delivery);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}