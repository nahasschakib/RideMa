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

export interface IDelivery {
  _id?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  deliverer?: mongoose.Types.ObjectId;

  // Expéditeur
  senderName: string;
  senderPhone: string;
  pickUpAddress: string;
  pickUpLocation: { type: 'Point'; coordinates: [number, number] };

  // Destinataire
  recipientName: string;
  recipientPhone: string;
  dropAddress: string;
  dropLocation: { type: 'Point'; coordinates: [number, number] };

  // Colis
  description: string;
  weightCategory: WeightCategory;
  weightKg?: number;
  isFragile: boolean;
  notes?: string;

  // Tarification
  zone?: string;
  basePrice: number;
  weightSurcharge: number;
  totalPrice: number;
  paymentMethod: 'cash' | 'wallet';
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

    senderName: { type: String, required: true },
    senderPhone: { type: String, required: true },
    pickUpAddress: { type: String, required: true },
    pickUpLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },

    recipientName: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    dropAddress: { type: String, required: true },
    dropLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },

    description: { type: String, required: true },
    weightCategory: {
      type: String,
      enum: ['light', 'medium', 'heavy', 'extra_heavy'],
      required: true,
    },
    weightKg: { type: Number },
    isFragile: { type: Boolean, default: false },
    notes: { type: String },

    zone: { type: String },
    basePrice: { type: Number, required: true },
    weightSurcharge: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'wallet'], default: 'cash' },
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