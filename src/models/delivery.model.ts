import mongoose from 'mongoose';
export type DeliveryStatus =
  | 'requested'
  | 'confirmed'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'failed';
export type WeightCategory = 'light' | 'medium' | 'heavy' | 'extra_heavy';
export type DeliveryType = 'colis' | 'courses' | 'hanout';

export interface IDelivery {
  _id?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  deliverer?: mongoose.Types.ObjectId;
  type: DeliveryType;
  // Expéditeur (colis uniquement)
  senderName?: string;
  senderPhone?: string;
  pickUpAddress: string;
  pickUpLocation: { type: 'Point'; coordinates: [number, number] };
  // Destinataire
  recipientName?: string;
  recipientPhone?: string;
  dropAddress: string;
  dropLocation: { type: 'Point'; coordinates: [number, number] };
  // Colis (type=colis)
  description?: string;
  weightCategory?: WeightCategory;
  weightKg?: number;
  isFragile?: boolean;
  notes?: string;
  // Courses/Hanout (type=courses|hanout)
  shoppingList?: string;
  estimatedAmount?: number;
  actualAmount?: number;
  receiptPhoto?: string;
  cashLimit?: number;
  reservedAmount?: number;
  penaltyApplied?: boolean;
  // Tarification
  zone?: string;
  basePrice: number;
  weightSurcharge: number;
  serviceFee?: number;
  deliveryFee?: number;
  surcharge?: number;
  totalFees?: number;
  totalPrice: number;
  paymentMethod: 'cash' | 'wallet' | 'cmi';
  paymentStatus: 'pending' | 'paid';
  // Statut
  status: DeliveryStatus;
  estimatedDistance?: number;
  pickupCode?: string;
  deliveryCode?: string;
  cancelReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
const deliverySchema = new mongoose.Schema<IDelivery>(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deliverer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['colis', 'courses', 'hanout'], default: 'colis', required: true },
    // Colis
    senderName: { type: String },
    senderPhone: { type: String },
    pickUpAddress: { type: String, required: true },
    pickUpLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    recipientName: { type: String },
    recipientPhone: { type: String },
    dropAddress: { type: String, required: true },
    dropLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    description: { type: String },
    weightCategory: {
      type: String,
      enum: ['light', 'medium', 'heavy', 'extra_heavy'],
    },
    weightKg: { type: Number },
    isFragile: { type: Boolean, default: false },
    notes: { type: String },
    // Courses / Hanout
    shoppingList: { type: String },
    estimatedAmount: { type: Number },
    actualAmount: { type: Number },
    receiptPhoto: { type: String },
    cashLimit: { type: Number, default: 200 },
    reservedAmount: { type: Number },
    penaltyApplied: { type: Boolean, default: false },
    // Tarification
    zone: { type: String },
    basePrice: { type: Number, required: true, default: 0 },
    weightSurcharge: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    surcharge: { type: Number, default: 0 },
    totalFees: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'wallet', 'cmi'], default: 'cash' },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'],
      default: 'requested',
    },
    estimatedDistance: { type: Number },
    pickupCode: { type: String },
    deliveryCode: { type: String },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

deliverySchema.index({ pickUpLocation: '2dsphere' });
deliverySchema.index({ dropLocation: '2dsphere' });

const Delivery = mongoose.models.Delivery || mongoose.model<IDelivery>('Delivery', deliverySchema);
export default Delivery;