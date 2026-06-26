import mongoose from "mongoose";

export type TransactionType = "credit" | "debit";
export type TransactionReason =
  | "trip_earning"
  | "commission"
  | "manual_deposit"
  | "commission_debit"
  | "topup"
  | "payment"
  | "refund";
export type WalletOwnerType = "driver" | "admin" | "client";
export type DepositStatus = "none" | "pending" | "active" | "refunded";

export interface ITransaction {
  type: TransactionType;
  amount: number;
  reason: TransactionReason;
  bookingId?: mongoose.Types.ObjectId;
  description: string;
  createdAt?: Date;
}

export interface IWallet {
  owner?: mongoose.Types.ObjectId;
  ownerType: WalletOwnerType;
  balance: number;
  transactions: ITransaction[];
  isActive: boolean;
  deposit: {
    amount: number;
    status: DepositStatus;
    paidAt?: Date;
    refundedAt?: Date;
  };
  depositThreshold: number;
  walletMinimum: number;
  preferredTopup: "cmi" | "virement";
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new mongoose.Schema<ITransaction>(
  {
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["trip_earning", "commission", "manual_deposit", "commission_debit", "topup", "payment", "refund"],
      required: true,
    },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const walletSchema = new mongoose.Schema<IWallet>(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ownerType: { type: String, enum: ["driver", "admin", "client"], required: true },
    balance: { type: Number, default: 0 },
    transactions: [transactionSchema],
    isActive: { type: Boolean, default: false },
    deposit: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["none", "pending", "active", "refunded"],
        default: "none",
      },
      paidAt: { type: Date },
      refundedAt: { type: Date },
    },
    depositThreshold: { type: Number, default: 500 },
    walletMinimum: { type: Number, default: 100 },
    preferredTopup: { type: String, enum: ["cmi", "virement"], default: "cmi" },
  },
  { timestamps: true }
);

const Wallet =
  mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", walletSchema);
export default Wallet;
