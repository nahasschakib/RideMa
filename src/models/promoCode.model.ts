import mongoose from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';
export type PromoTarget = 'ride' | 'delivery' | 'both';

export interface IPromoCode {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  target: PromoTarget;
  maxUses: number;
  usedCount: number;
  usedBy: mongoose.Types.ObjectId[];
  isActive: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const promoCodeSchema = new mongoose.Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number },
    minOrderAmount: { type: Number, default: 0 },
    target: { type: String, enum: ['ride', 'delivery', 'both'], default: 'both' },
    maxUses: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const PromoCode = mongoose.models.PromoCode ||
  mongoose.model<IPromoCode>('PromoCode', promoCodeSchema);
export default PromoCode;