import mongoose from 'mongoose';

export interface IWeightPrice {
  light: number;      // 0-2kg
  medium: number;     // 2-5kg
  heavy: number;      // 5-15kg
  extra_heavy: number; // 15kg+
}

export interface IDeliveryZone {
  name: string;
  city: string;
  basePrice: number;
  weightPrices: IWeightPrice;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const deliveryZoneSchema = new mongoose.Schema<IDeliveryZone>(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    basePrice: { type: Number, required: true },
    weightPrices: {
      light:       { type: Number, required: true },
      medium:      { type: Number, required: true },
      heavy:       { type: Number, required: true },
      extra_heavy: { type: Number, required: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const DeliveryZone = mongoose.models.DeliveryZone ||
  mongoose.model<IDeliveryZone>('DeliveryZone', deliveryZoneSchema);
export default DeliveryZone;