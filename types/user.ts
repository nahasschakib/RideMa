
type VideoKycStatus=
  "not_required"
  | "pending"
  | "in_progress"
  | "approved"
  |"rejected"


export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "partner" | "admin";
  isEmailVerified?: boolean;
  partnerOnBoardingSteps: number;
  mobileNumber?: string;
  partnerStatus:"pending" | "approved" | "rejected";
  rejectionReason?: string;
  videoKycStatus:VideoKycStatus;
  videoKycRoomId:string;
  socketId:string | null;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  isOnline?: boolean;
  videoKycRejectionReason:string;
  createdAt: string;
  updatedAt: string;
}

