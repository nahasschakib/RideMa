import mongoose from 'mongoose';

export interface ICompanyEmployee {
  company: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  monthlyLimit?: number;
  currentMonthSpend: number;
  isActive: boolean;
  department?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const companyEmployeeSchema = new mongoose.Schema<ICompanyEmployee>(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    monthlyLimit: { type: Number },
    currentMonthSpend: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    department: { type: String },
  },
  { timestamps: true }
);

const CompanyEmployee = mongoose.models.CompanyEmployee ||
  mongoose.model<ICompanyEmployee>('CompanyEmployee', companyEmployeeSchema);
export default CompanyEmployee;