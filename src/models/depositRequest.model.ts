import mongoose from "mongoose";

export type DepositStatus = "pending" | "validated" | "rejected";
export type DepositType = "caution" | "topup" | "refund";

export interface IDepositRequest {
  driver: mongoose.Types.ObjectId;
  depositCode: string;
  amount: number;
  receiptDescription: string;
  type: DepositType;
  status: DepositStatus;
  validatedBy?: mongoose.Types.ObjectId;
  validatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const depositRequestSchema = new mongoose.Schema<IDepositRequest>(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    depositCode: { type: String, required: true },
    amount: { type: Number, required: true },
    receiptDescription: { type: String, required: true },
    type: {
      type: String,
      enum: ["caution", "topup", "refund"],
      default: "caution",
    },
    status: {
      type: String,
      enum: ["pending", "validated", "rejected"],
      default: "pending",
    },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

const DepositRequest =
  mongoose.models.DepositRequest ||
  mongoose.model<IDepositRequest>("DepositRequest", depositRequestSchema);
export default DepositRequest;
