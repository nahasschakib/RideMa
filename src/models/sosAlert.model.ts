import mongoose from 'mongoose';

const sosAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userPhone: { type: String },
  role: { type: String, enum: ['user', 'partner'], required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  bookingId: { type: String },
}, { timestamps: true });

const SOSAlert = mongoose.models.SOSAlert || mongoose.model('SOSAlert', sosAlertSchema);
export default SOSAlert;