import mongoose from "mongoose";

export interface IPartnerBank {
  owner: mongoose.Types.ObjectId;
  accountNumber: string;
  accountHolderName: string;
  mobilePaymentId: string;
  ribiban: string;
  status: "not_added" | "verified" | "added" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
const partnerBankSchema = new mongoose.Schema<IPartnerBank>(
  {
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
     accountNumber: {
        type: String, 
        required: true,
        unique: true
    },
     accountHolderName: {
        type: String,
         required: true
        },
     mobilePaymentId: {
        type: String, 
        },
    ribiban: {
        type: String,
        uppercase: true,
        required: true},
    
    status: {
      type: String,
      enum: ["not_added", "verified", "added", "rejected"],
      default: "not_added",
    },
  },
  { timestamps: true },
);

const PartnerBank =
  mongoose.models.PartnerBank ||
  mongoose.model<IPartnerBank>("PartnerBank", partnerBankSchema);
export default PartnerBank;
