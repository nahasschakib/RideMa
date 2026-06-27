import mongoose from 'mongoose';

export interface ISupportMessage {
  userId: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  sender: 'user' | 'admin';
  text: string;
  read: boolean;
  createdAt?: Date;
}

const supportMessageSchema = new mongoose.Schema<ISupportMessage>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sender: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SupportMessage = mongoose.models.SupportMessage ||
  mongoose.model<ISupportMessage>('SupportMessage', supportMessageSchema);
export default SupportMessage;