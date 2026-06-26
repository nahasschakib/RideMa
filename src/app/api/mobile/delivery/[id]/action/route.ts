import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Delivery from '@/models/delivery.model';

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
    const { action, code, cancelReason } = await req.json();

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
        break;

      case 'transit':
        if (String(delivery.deliverer) !== String(user._id)) {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }
        delivery.status = 'in_transit';
        break;

      case 'deliver':
            if (String(delivery.deliverer) !== String(user._id)) {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
            }
            if (code !== delivery.deliveryCode) {
                return NextResponse.json({ error: 'Code de livraison incorrect' }, { status: 400 });
            }
            delivery.status = 'delivered';
            delivery.paymentStatus = 'paid';

            // Débit wallet automatique si paiement par wallet
            if (delivery.paymentMethod === 'wallet') {
                const Wallet = (await import('@/models/wallet.model')).default;
                const clientWallet = await Wallet.findOne({
                owner: delivery.client,
                ownerType: 'client',
                });
                if (!clientWallet) {
                return NextResponse.json({ error: 'Wallet client introuvable' }, { status: 404 });
                }
                if (clientWallet.balance < delivery.totalPrice) {
                return NextResponse.json({
                    error: `Solde insuffisant — ${clientWallet.balance} MAD disponible, ${delivery.totalPrice} MAD requis`,
                }, { status: 400 });
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
            break;

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
    console.log(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}