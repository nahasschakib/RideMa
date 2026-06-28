
import mongoose from "mongoose";
import { IUser } from "../../types/user";


export interface IUserDocument extends IUser {
  password?: string;
  otp?: string;
  otpExpiredAt?: Date;
  expoPushToken:string;
  roles?:string[];
  photoUrl:string;
  gender?: 'male' | 'female';
  
}

const userSchema = new mongoose.Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "partner", "admin","business_admin"],
      default: "user",
    },
    roles: {
      type: [String],
      enum: ["user", "partner", "admin","business_admin"],
      default: ["user"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    partnerOnBoardingSteps: {
      type: Number,
      min: 0,
      max:8,
      default: 0,
    },
    mobileNumber: {
      type: String,
    },
      expoPushToken: {
      type: String,
    },
    partnerStatus:{
      type:String,
     enum:["pending","approved","rejected"],
     default:"pending"
    },
    photoUrl: {
    type: String,
    default: null,
    },
    gender: {
    type: String,
    enum: ['male', 'female'],
    },
    rejectionReason:{
      type:String
    },
    videoKycStatus:{
      type:String,
      enum:["not_required","pending","in_progress","approved","rejected"],
      default:"not_required"
    },
    videoKycRoomId:{
      type:String,
    },
    videoKycRejectionReason:{
      type:String,
    },
    otp: {
      type: String,
    },
    otpExpiredAt: {
      type: Date,
    },
    socketId: {
      type: String,
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);


userSchema.index({ location: "2dsphere" });
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
