import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Delivery from '@/models/delivery.model';
import Wallet from '@/models/wallet.model';
import { calculateExpressFees, calculateReservedAmount } from '@/lib/expressPricing';

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const {
      type, // 'courses' | 'hanout'
      pickUpAddress, pickUpLocation,
      dropAddress, dropLocation,
      shoppingList, estimatedAmount,
      paymentMethod, // 'cash' | 'wallet' | 'cmi'
      notes,
      distanceKm,
    } = await req.json();

    if (!['courses', 'hanout'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }
    if (!pickUpAddress || !pickUpLocation || !dropAddress || !dropLocation ||
        !shoppingList || !estimatedAmount || !paymentMethod) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const fees = calculateExpressFees(distanceKm ?? 5, new Date());
    const reservedAmount = calculateReservedAmount(estimatedAmount, fees.totalFees);

    // Validation selon mode de paiement
    if (paymentMethod === 'cash') {
      if (estimatedAmount > 200) {
        return NextResponse.json({
          error: 'Le paiement cash est limité à 200 MAD. Veuillez utiliser le wallet ou la carte.',
        }, { status: 400 });
      }
    }

    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ owner: user._id, ownerType: 'client' });
      if (!wallet || wallet.balance < reservedAmount) {
        return NextResponse.json({
          error: `Solde insuffisant. ${reservedAmount} MAD requis (${wallet?.balance ?? 0} MAD disponible).`,
        }, { status: 400 });
      }
      // Réservation du montant (bloqué) — utilise reason "payment" en attendant le calcul final
      wallet.balance -= reservedAmount;
      wallet.transactions.unshift({
        type: 'debit',
        amount: reservedAmount,
        reason: 'payment',
        description: `Réservation ${type === 'hanout' ? 'Hanout' : 'Courses'} — ${pickUpAddress}`,
      });
      await wallet.save();
    }
    // CMI : pré-autorisation gérée côté front via redirection — placeholder ici
    if (paymentMethod === 'cmi') {
      // TODO Phase paiement CMI — pour l'instant on bloque pas, juste on note le statut
    }

    const delivery = await Delivery.create({
      client: user._id,
      type,
      pickUpAddress,
      pickUpLocation: { type: 'Point', coordinates: pickUpLocation },
      dropAddress,
      dropLocation: { type: 'Point', coordinates: dropLocation },
      shoppingList,
      estimatedAmount,
      notes: notes ?? null,
      cashLimit: 200,
      reservedAmount: paymentMethod === 'wallet' ? reservedAmount : null,
      basePrice: 0,
      weightSurcharge: 0,
      serviceFee: fees.serviceFee,
      deliveryFee: fees.deliveryFee,
      surcharge: fees.surcharge,
      totalFees: fees.totalFees,
      totalPrice: fees.totalFees, // les frais MaRide uniquement, le panier est séparé
      paymentMethod,
      pickupCode: generateCode(),
      deliveryCode: generateCode(),
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error('Create express error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}