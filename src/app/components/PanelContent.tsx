"use client";

import {
  Banknote,
  Bike,
  Car,
  Clock,
  Loader2,
  MessageCircle,
  Phone,
  Truck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import RideChat from "./RideChat";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { BookingStatus, PaymentStatus } from "@/models/booking.model";

interface PopulatedBooking {
  _id: string;
  bookingStatus?: BookingStatus;
  user: { _id: string; name?: string } | null;
  driver: { _id: string; name?: string };
  vehicle: { type?: string; model?: string; number?: string } | string;
  fare?: number;
  pickUpAddress: string;
  dropAddress: string;
  paymentStatus?: PaymentStatus;
  userMobileNumber?: string;
}

interface PanelContentProps {
  isActive: boolean;
  displayEta: number;
  displayDistance?: number;
  paymentStatus: { cls?: string; label: string };
  booking: PopulatedBooking;
  canChat: boolean;
  chatOpen: boolean;
  onChatToggle: () => void;
  actionLoading?: boolean;
  actionError?: string | null;
  onAction?: () => void;
}

const getVehicleIcon = (vehicleType?: string) => {
 
  switch (vehicleType?.toLowerCase()) {
    case "bike":
    case "motocycle":   
    case "scooter":
      return <Bike size={18} className="text-white" />;
    case "truck":
    case "bus":
    case "van":
      return <Truck size={18} className="text-white" />;
    case "car":
    default:
      return <Car size={18} className="text-white" />;
  }
};
function PanelContent({
  isActive,
  displayEta,
  displayDistance,
  paymentStatus,
  booking,
  canChat,
  chatOpen,
  onChatToggle,
  actionLoading,
  actionError,
  onAction,
}: PanelContentProps) {
  const { userData } = useSelector((state: RootState) => state.user);
  const currentRole: "user" | "driver" | "admin" =
    userData?._id === booking.driver._id ? "driver" : "user";

  return (
    <div className="flex flex-col pt-5 pb-4 gap-3">
      {isActive && (
        <div className="mx-5 lg:mx-6 grid grid-cols-2 gap-2">
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-zinc-400 text-[10px] tracking-wider font-semibold">
                Temps estimé
              </p>
              <p className="text-zinc-900 text-lg font-black leading-none mt-0.5">
                {Math.round(displayEta)}
                <span className="text-xs font-normal text-zinc-400 ml-0.5">
                  {" "}
                  min
                </span>
              </p>
            </div>
          </div>

          <div className="bg-zinc-950 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Banknote size={16} className="text-amber-400" />
            </div>

            <div className="">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold ">
                Tarif estime{" "}
              </p>
              <p className="text-white flex text-lg font-black leading-none mt-0.5">
                {booking.fare || "--"}{" "}
                <span className="text-xs font-normal text-zinc-400 ml-0.5">
                  {" "}
                  MAD
                </span>
              </p>
            </div>
            <div></div>

            {/* {displayDistance && (
              <span className="text-white text-lg font-black leading-none mt-0.5">
                {Math.round(displayDistance)} km
              </span>
            )} */}
          </div>
        </div>
      )}

      {booking.user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-5 lg:mx-6"
        >
          <div className="bg-zinc-950 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative flex shrink-0">
              <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center">
                <User size={26} className="text-zinc-300" />
              </div>
              <div className="absolute -bottom-1 right-1 bg-emerald-400 rounded-full w-4 h-4 border-2 border-zinc-950" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-semibold text-base truncate">
                  {booking.user.name || "customer"}
                </p>
                <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-full shrink-0">
                  <Banknote size={10} className="text-amber-400" />
                  <span className="text-white text-xs font-medium">
                    {booking.fare ? "Payé" : "Non payé"}
                  </span>
                </div>
              </div>
              {booking.paymentStatus && (
                <div className="flex items-center gap-2 mt-1.5 ">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full text-zinc-300
                    font-semibold ${paymentStatus.cls ?? "bg-zinc-700 text-zinc-300"}`}
                  >
                    {paymentStatus.label}
                  </span>
                </div>
              )}
            </div>
          </div>
          {isActive && (
            <div className="flex gap-2 mt-2">
              {booking.userMobileNumber && (
                <a
                  href={`tel:${booking.userMobileNumber}`}
                  className={`flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 active:scale-[0.97] transition-all text-zinc-900 py-3  rounded-xl text-sm font-semibold ${canChat ? "flex-1" : "w-full"}`}
                >
                  <Phone size={15} />
                  Call
                </a>
              )}
              {canChat && (
                <button
                  onClick={onChatToggle}
                  className={`flex-1 flex items-center justify-center gap-2 active:scale-[0.97] transition-all
        py-3 rounded-xl text-sm font-semibold ${chatOpen ? "bg-zinc-200 text-zinc-900" : "bg-zinc-900 hover:bg-zinc-800 text-white"}`}
                >
                  <MessageCircle size={15} />
                  {chatOpen ? "Fermer le chat" : "Ouvrir le chat"}
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {currentRole === "driver" && isActive && onAction && (
        <div className="mx-5 lg:mx-6 flex flex-col gap-2">
          {actionError && (
            <p className="text-red-500 text-xs font-medium px-1">
              {actionError}
            </p>
          )}
           <button
            onClick={onAction}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 active:scale-[0.97] transition-all text-white disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : booking.bookingStatus === "confirmed" ? (
              "Démarrer le trajet"
            ) : (
              "Terminer le trajet"
            )}
          </button> 
        </div>
      )}

      <AnimatePresence>
        {chatOpen && canChat && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-5 lg:mx-6 overflow-hidden"
          >
            <div className="rounded-2xl overflow-hidden border border-zinc-100 h-115">
              <RideChat
                currentRole={currentRole}
                bookingId={booking._id}
                userName={booking?.user?.name || "customer"}
                driverName={booking?.driver?.name || "driver"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {booking?.vehicle && (
        <div className="mx-5 lg:mx-6">
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
              {getVehicleIcon(typeof booking.vehicle === "object" ? booking.vehicle.type : undefined)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Votre véhicule
              </p>
              <p className="text-sm font-bold text-zinc-900 truncate">
                {typeof booking.vehicle === "object"
                  ? (booking.vehicle.model ?? "—")
                  : (booking.vehicle ?? "—")}
              </p>
            </div>
            <div className="shrink-0 bg-zinc-900 px-3 py-1.5 rounded-lg">
              <p className="text-white text-xs font-black tracking-widest font-mono">
                {typeof booking.vehicle === "object"
                  ? (booking.vehicle.number ?? "—")
                  : (booking.vehicle ?? "—")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-5 lg:mx-6">
        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl overflow-hidden">
          <div className="flex gap-3 p-4 border-b border-zinc-100">
            <div className="flex flex-col items-center shrink-0 pt-1">
              <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white shadow-sm" />
              <div className="w-px bg-zinc-200 mt-1 style={{height:20}}" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                Départ
              </p>
              <p className="text-sm text-zinc-800 leading-snug">
                {booking.pickUpAddress}
              </p>
            </div>
          </div>
           <div className="flex gap-3 p-4 border-b border-zinc-100">
            <div className="flex flex-col items-center shrink-0 pt-1">
              <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white shadow-sm" />
              <div className="w-px bg-zinc-200 mt-1 style={{height:20}}" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                 Arrivée
              </p>
              <p className="text-sm text-zinc-800 leading-snug">
                {booking.dropAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PanelContent;
