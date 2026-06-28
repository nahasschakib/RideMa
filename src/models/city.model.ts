import mongoose from 'mongoose';

export interface ICity {
  name: string;
  nameAr: string;
  isActive: boolean;
  coordinates: { lat: number; lng: number };
  radiusKm: number;
  pricing: {
    baseFare: number;
    pricePerKM: number;
    waitingCharge: number;
    minimumFare: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const citySchema = new mongoose.Schema<ICity>(
  {
    name: { type: String, required: true, unique: true },
    nameAr: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    radiusKm: { type: Number, required: true, default: 30 },
    pricing: {
      baseFare:      { type: Number, required: true },
      pricePerKM:    { type: Number, required: true },
      waitingCharge: { type: Number, required: true },
      minimumFare:   { type: Number, required: true },
    },
  },
  { timestamps: true }
);

const City = mongoose.models.City || mongoose.model<ICity>('City', citySchema);
export default City;