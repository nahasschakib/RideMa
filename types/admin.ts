// types/admin.ts


export type PartnerReview = {
  _id: string;
  name: string;
  email: string;
  videoKycStatus:string;
  videoKycRoomId:string;
  vehicleType: string | undefined; // undefined si aucun véhicule trouvé
}

export type DashboardStats = {
  totalPartners: number;
  totalApprovedPartners: number;
  totalPendingPartners: number;
  totalRejectedPartners: number;
}

export type DashboardApiResponse = {
  stats: DashboardStats;
  pendingPartnersReviews: PartnerReview[];
  pendingVehicles: VehicleReview[];
}

export interface PendingKycItem {
  _id:string
  name: string
  email: string
  videoKycRoomId:string
  videoKycStatus:string
  videoUrl?: string
}

export interface VehicleReview {
  _id:string
  name: string
  email: string
  videoKycRoomId:string
  videoKycStatus:string
  vehicleId?: string
}