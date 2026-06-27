import mongoose from 'mongoose';

export type CompanyPlan = 'prepaid' | 'monthly' | 'both';
export type CompanyStatus = 'pending' | 'active' | 'suspended';

export interface ICompany {
  name: string;
  email: string;
  phone: string;
  address: string;
  ice: string; // Identifiant Commun de l'Entreprise (Maroc)
  logo?: string;
  adminUser: mongoose.Types.ObjectId;
  plan: CompanyPlan;
  status: CompanyStatus;
  wallet: {
    balance: number;
    transactions: {
      type: 'credit' | 'debit';
      amount: number;
      reason: string;
      description: string;
      createdAt?: Date;
    }[];
  };
  monthlyLimit?: number;
  currentMonthSpend: number;
  employeeCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const companySchema = new mongoose.Schema<ICompany>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    ice: { type: String, required: true, unique: true },
    logo: { type: String },
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['prepaid', 'monthly', 'both'], default: 'prepaid' },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    wallet: {
      balance: { type: Number, default: 0 },
      transactions: [{
        type: { type: String, enum: ['credit', 'debit'], required: true },
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        description: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }],
    },
    monthlyLimit: { type: Number },
    currentMonthSpend: { type: Number, default: 0 },
    employeeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', companySchema);
export default Company;