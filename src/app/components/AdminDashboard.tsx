"use client";
import axios from "axios";
import { CheckCircle2, Clock, Truck, User, Users, Video, XCircle } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Kpi from "./Kpi";
import TabButton from "./TabButton";
import { DashboardApiResponse,DashboardStats,PartnerReview,PendingKycItem,VehicleReview } from "@/../types/admin";
import {AnimatePresence, motion} from "motion/react"
import ContentList from "./ContentList";
import AdminEaring from "./AdminEaring";


type Tab = "partner"|"kyc"|"vehicle"

function AdminDashboard() {
  const [stats,setStats]=useState<DashboardStats| null>(null)
  const [activeTab,setActiveTab]=useState<Tab>("partner")
  const [partnerReviews,setPartnerReviews]=useState<PartnerReview[]>([])
  const [pendingKyc,setPendingKyc]=useState<PendingKycItem[]>([])
  const [vehicleReviews,setVehicleReviews]=useState<VehicleReview[]>([])
  

   const handleGetData = async () => {
      try {
        const { data } = await axios.get<DashboardApiResponse>("/api/admin/adminDashboard");
       setStats(data.stats)
       setPartnerReviews(data.pendingPartnersReviews)
       setVehicleReviews(data.pendingVehicles)
      } catch (error) {
        console.log(error);
      }
    };
   const handleGetPendingKYC = async () => {
      try {
        const { data } = await axios.get("/api/admin/video-kyc/pending");
        setPendingKyc(data)
      } catch (error) {
        console.log(error);
      }
    };
    
  useEffect(() => {
    const init = async ()=>{
      await Promise.all([handleGetPendingKYC(),handleGetData()])
    };
    init();
 }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-200">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b z-40">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={"/logo1.png"} alt="logo" width={50} height={50} priority/>
            <span className="font-bold text-lg tracking-wide">MaRide Admin</span>
           </div>
          
           <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-black text-white">
              <User size={14}/>
              Admin Dashboard
          </div>
        </div>
      </div>
<main className="max-w-7xl mx-auto px-6 py-12 space-y-18">
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      <Kpi label="Total des partenaires" value={stats?.totalPartners} icon={<Users/>} variant={"totalPartners"}/>
      <Kpi label="Partenaires approuvés" value={stats?.totalApprovedPartners} icon={<CheckCircle2/>}  variant={"approved"}/>
      <Kpi label="Partenaires en attente" value={stats?.totalPendingPartners} icon={<Clock/>}  variant={"pending"}/>
      <Kpi label="Partenaires rejetés" value={stats?.totalRejectedPartners} icon={<XCircle/>}  variant={"rejected"}/>
   </div>

   <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100 flex flex-wrap gap-2">
    <TabButton 
    active={activeTab=="partner"} 
    count={partnerReviews.length ?? 0}
    icon={<Users size={15}/>}
    onClick={()=>setActiveTab("partner")}
    >
     Avis des partenaires

    </TabButton>
     
    <TabButton 
    active={activeTab=="kyc"} 
    count={pendingKyc.length ?? 0}
    icon={<Video size={15}/>}
    onClick={()=>setActiveTab("kyc")}
    >
     en attente Vidéo KYC

    </TabButton>
      <TabButton 
    active={activeTab=="vehicle"} 
    count={vehicleReviews.length ?? 0}
    icon={<Truck size={15}/>}
    onClick={()=>setActiveTab("vehicle")}
    >
    Examens de véhicules en attente

    </TabButton>
   </div>
   <AnimatePresence mode="wait">
    <motion.div
    key={activeTab}
    initial={{opacity:0, y:16}}
    animate={{opacity:1, y:0}}
    exit={{opacity:0, y:-8}}
    transition={{duration:0.2, ease:"easeOut"}}
    className="space-y-3"
    >
      {activeTab=="partner" && <ContentList data={partnerReviews ?? []} type={"partner"}/>}
      {activeTab=="kyc" && <ContentList data={pendingKyc ?? []} type={"kyc"}/>}
      {activeTab=="vehicle" && <ContentList data={vehicleReviews ?? []} type={"vehicle"}/>}
    </motion.div>
   </AnimatePresence>

  <AdminEaring/>

</main>

</div>
  );
}

export default AdminDashboard;
