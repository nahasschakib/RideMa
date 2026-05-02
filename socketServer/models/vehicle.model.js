import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["car","motocycle","scooter","vélo","truck","bus","van","other"],
    required: true,
  },
  number:   { type: String, required: true, unique: true },
  model:    { type: String, required: true },
  baseFare:       { type: Number },
  imageUrl:       { type: String },
  pricePerKM:     { type: Number },
  waitingCharge:  { type: Number },
  status: {
    type: String,
    enum: ["approved","rejected","pending"],
    default: "pending",
  },
  rejectionReason: { type: String },
  isActive:    { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: false },
  location: {
    type:        { type: String, enum: ["Point"] },
    coordinates: [Number],
  },
}, { timestamps: true });

vehicleSchema.index({ location: "2dsphere" });

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
