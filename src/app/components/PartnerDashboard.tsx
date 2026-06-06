"use client";
import React, { useEffect, useState } from "react";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Check, Clock, Lock, Video } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "@/redux/userSlice";
import RejectionCard from "./RejectionCard";
import StatusCard from "./StatusCard";
import ActionCard from "./ActionCard";
import axios from "axios";
import PricingModal from "./PricingModal";
import { IVehicle } from "@/models/vehicle.model";
import PartnerEaring from "./PartnerEarning";

type Step = {
  id: number;
  title: string;
  route?: string;
};

const STEPS: Step[] = [
  { id: 1, title: "Véhicule", route: "/partner/onboarding/vehicle" },
  { id: 2, title: "Documents", route: "/partner/onboarding/documents" },
  { id: 3, title: "Banque", route: "/partner/onboarding/bank" },
  { id: 4, title: "Révision" },
  { id: 5, title: "Video KYC" },
  { id: 6, title: "Tarification" },
  { id: 7, title: "Révision finale" },
  { id: 8, title: "En ligne" },
];

const TOTAL_STEPS = STEPS.length;

function PartnerDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData } = useSelector((state: RootState) => state.user);
  const onBoardingSteps = userData?.partnerOnBoardingSteps ?? 0;
  const activeStep = onBoardingSteps + 1;
  const isLive = onBoardingSteps >= 7 && userData?.partnerStatus === "approved";
  const [requestLoading, setRequestLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [vehicleData, setVehicleData] = useState<IVehicle | null>(null);

  useEffect(() => {
    if (onBoardingSteps < 5) return;

    const handleGetPricing = async () => {
      try {
        const { data } = await axios.get("/api/partner/onboarding/pricing");
        setVehicleData(data);
      } catch (error) {
        console.log(error);
      }
    };

    handleGetPricing();
  }, [onBoardingSteps]);

  useEffect(() => {
    if (userData?.partnerStatus !== "pending") return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get("/api/user/admin");
        dispatch(setUserData(data));
      } catch {
        // silently ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [userData?.partnerStatus, dispatch]);

  const goToStep = (step: Step) => {
    if (
      step.id == 6 &&
      userData?.partnerStatus === "approved" &&
      userData.videoKycStatus === "approved"
    ) {
      setShowPricing(true);
      return;
    }
    if (step.route && step.id <= activeStep) {
      router.push(step.route);
    }
  };

  const progressPercentage = ((activeStep - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-200 px-4 pt-28 pb-20">
      <div className="max-w-7xl mx-auto space-y-16">
        <div>
          <h1 className="text-4xl font-bold">Intégration des partenaires</h1>
          <p className="text-gray-600 mt-3">
            Suivez toutes les étapes pour activer votre compte.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-xl border">
          <div className="overflow-x-auto pb-2">
            <div className="relative min-w-200">
              <div className="absolute top-7 left-0 h-0.5 w-full bg-gray-200 rounded-full" />
              <motion.div
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.6 }}
                className="absolute top-7 left-0 h-0.5 bg-black rounded-full"
              />
              <div className="relative flex justify-between">
                {STEPS.map((step) => {
                  const isCompleted = step.id < activeStep;
                  const isCurrent = step.id === activeStep;
                  const locked = step.id > activeStep;

                  return (
                    <motion.div
                      key={step.id}
                      whileHover={!locked ? { scale: 1.1 } : {}}
                      onClick={() => goToStep(step)}
                      className="flex flex-col items-center z-10 cursor-pointer"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold transition-all
                          ${
                            isCompleted
                              ? "bg-black text-white"
                              : isCurrent
                                ? "border border-black text-black bg-white"
                                : "border border-gray-200 text-gray-400 bg-white"
                          }`}
                      >
                        {isCompleted ? (
                          <Check size={20} />
                        ) : locked ? (
                          <Lock size={16} />
                        ) : (
                          step.id
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium whitespace-nowrap mt-2
                          ${isCompleted || isCurrent ? "text-black" : "text-gray-400"}`}
                      >
                        {step.title}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {activeStep <= TOTAL_STEPS && STEPS[activeStep - 1]?.route && (
            <div className="mt-10">
              <p className="text-gray-600 text-sm mb-4">
                Étape actuelle :{" "}
                <span className="font-semibold">
                  {STEPS[activeStep - 1]?.title}
                </span>
              </p>
              <button
                onClick={() => router.push(STEPS[activeStep - 1].route!)}
                className="px-6 py-3 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition"
              >
                Continuer l&apos;intégration →
              </button>
            </div>
          )}

          {activeStep > TOTAL_STEPS && (
            <p className="mt-10 text-green-600 font-semibold">
              ✅ Intégration complète !
            </p>
          )}
        </div>

        {activeStep == 4 && userData?.partnerStatus === "rejected" && (
          <RejectionCard
            title="Partner Rejected"
            reason={userData.rejectionReason}
            actionLabel="Review and Update"
            onAction={() => router.push("/partner/onboarding/vehicle")}
          />
        )}

        {activeStep == 4 && userData?.partnerStatus === "pending" && (
          <StatusCard
            icon={<Clock size={18} />}
            title="Documents under review"
            desc="Admin is verifying your documents"
          />
        )}

        {activeStep == 5 &&
          (userData?.videoKycStatus === "approved" ? (
            <StatusCard
              icon={<Check size={18} />}
              title="Video KYC approved"
              desc="You can now proceed to pricing"
            />
          ) : userData?.videoKycStatus === "rejected" ? (
            <RejectionCard
              title="Video KYC Rejected"
              reason={userData?.videoKycRejectionReason}
              actionLabel={requestLoading ? "Requesting..." : "Request Again"}
              onAction={async () => {
                setRequestLoading(true);
                await axios.get("/api/partner/video-kyc/request");
                setRequestLoading(false);
              }}
            />
          ) : userData?.videoKycStatus === "in_progress" &&
            userData?.videoKycRoomId ? (
            <ActionCard
              icon={<Video size={18} />}
              title="Admin Started Video KYC"
              button="Join Call"
              onclick={() => router.push(`/video-kyc/${userData.videoKycRoomId}`)}
            />
          ) : (
            <StatusCard
              icon={<Clock size={18} />}
              title="Waiting for Admin"
              desc="Admin will initiate Video KYC shortly"
            />
          )
          )}

       {activeStep==7 && vehicleData?.status ==="pending" && (
        <StatusCard
          icon={<Clock size={20}/>}
          title="Pricing under Review"
          desc="Admin is reviewing your pricing"
        
        />
       )}
         {activeStep==7 && vehicleData?.status ==="rejected" && (
        <RejectionCard
          title="Pricing Rejected"
          reason={vehicleData.rejectionReason}
          actionLabel="Edit & Resubmit"
          onAction={()=>setShowPricing(true)}
         />
       )}

        {isLive && (
          <motion.div
          initial={{opacity:0,y:30}}
          animate={{opacity:1, y:0}}
          className="bg-black text-white rounded-3xl p-10 shadow-2xl"
          >
            <h2 className="tex-2xl font-bold">
              🚀   Vous etes en ligne
            </h2>
            <button
            onClick={() => router.push("/partner/pending-requests")}
            className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-semibold flex
            items-center justify-center gap-2">
              Aller aux réservations <ArrowRight size={16}/>
            </button>
          </motion.div>
        )}
        
        <PartnerEaring/>
      </div>

      <PricingModal
        
        open={showPricing}
        onClose={()=>setShowPricing(false)}
        data={vehicleData}
      />

       
    </div>
  );
}

export default PartnerDashboard;