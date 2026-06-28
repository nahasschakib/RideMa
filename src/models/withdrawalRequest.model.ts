import mongoose from 'mongoose';

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface IWithdrawalRequest {
  driver: mongoose.Types.ObjectId;
  amount: number;
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ribiban: string;
  };
  status: WithdrawalStatus;
  rejectionReason?: string;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const withdrawalRequestSchema = new mongoose.Schema<IWithdrawalRequest>(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    bankDetails: {
      accountHolder: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ribiban: { type: String, required: true },
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

const WithdrawalRequest = mongoose.models.WithdrawalRequest ||
  mongoose.model<IWithdrawalRequest>('WithdrawalRequest', withdrawalRequestSchema);
export default WithdrawalRequest;