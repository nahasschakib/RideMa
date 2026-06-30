// src/lib/expressPricing.ts

export interface ZoneFees {
  serviceFee: number;
  deliveryFee: number;
}

const ZONE_FEES: Record<'zone1' | 'zone2' | 'zone3', ZoneFees> = {
  zone1: { serviceFee: 15, deliveryFee: 15 }, // < 3km
  zone2: { serviceFee: 15, deliveryFee: 25 }, // 3-7km
  zone3: { serviceFee: 15, deliveryFee: 35 }, // > 7km
};

export function getZoneFromDistance(distanceKm: number): 'zone1' | 'zone2' | 'zone3' {
  if (distanceKm < 3) return 'zone1';
  if (distanceKm <= 7) return 'zone2';
  return 'zone3';
}

export function getTimeSurcharge(date: Date = new Date()): number {
  const hour = date.getHours();
  const day = date.getDay(); // 0=dimanche, 6=samedi
  const isWeekend = day === 0 || day === 5 || day === 6; // vendredi/samedi/dimanche au Maroc

  let surcharge = 0;

  if (hour >= 23 || hour < 6) {
    surcharge += 20; // nuit
  } else if (hour >= 20 && hour < 23) {
    surcharge += 10; // soirée
  }

  if (isWeekend) {
    surcharge += 5;
  }

  return surcharge;
}

export interface ExpressFeesResult {
  serviceFee: number;
  deliveryFee: number;
  surcharge: number;
  totalFees: number;
}

export function calculateExpressFees(distanceKm: number, date: Date = new Date()): ExpressFeesResult {
  const zone = getZoneFromDistance(distanceKm);
  const { serviceFee, deliveryFee } = ZONE_FEES[zone];
  const surcharge = getTimeSurcharge(date);
  const totalFees = serviceFee + deliveryFee + surcharge;

  return { serviceFee, deliveryFee, surcharge, totalFees };
}

export function calculateReservedAmount(estimatedAmount: number, totalFees: number): number {
  return Math.round(estimatedAmount * 1.2 + totalFees);
}

export const DRIVER_SHARE = 0.85;
export const ADMIN_SHARE = 0.15;