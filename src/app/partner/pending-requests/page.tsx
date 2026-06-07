"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import axios, { AxiosError } from "axios";
import { BookingStatus, PaymentStatus } from "@/models/booking.model";
import { Clock, Loader2, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

 interface IBooking {
  _id:string
  user: string
  driver: string
  vehicle: string

  pickUpAddress: string;
  dropAddress: string;

  pickUpLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  dropLocation: {
    type: "Point";
    coordinates: [number, number];
  };

  fare: number;

  userMobileNumber: string;
  driverMobileNumber: string;

  bookingStatus: BookingStatus

  paymentStatus: PaymentStatus

  paymentDeadline:Date;
  adminCommission: number;
  partnerAmount: number;

  pickUpOtp: string;
 pickUpOtpExpires: Date;
  dropOtp: string;
  dropOtpExpires: Date;
  createdAt?: Date;
  updatedAt?: Date;
}



function Page() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const emptyCount = useRef(0);

  useEffect(() => {
    emptyCount.current = 0;

    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/partner/bookings/pending");
        setBookings(data);
        emptyCount.current = data.length === 0 ? 1 : 0;
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get("/api/partner/bookings/pending");
        setBookings(data);
        if (data.length === 0) {
          emptyCount.current += 1;
          if (emptyCount.current >= 3) clearInterval(interval);
        } else {
          emptyCount.current = 0;
        }
      } catch {
        // silent — ne pas interrompre l'UI si le poll échoue
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const notifyBadge = () =>
    window.dispatchEvent(new Event("pending-count-changed"));

  const handleAccept = async (id: string) => {
    if (actionLoading) return;
    setActionError(null);
    try {
      setActionLoading(id);
      await axios.post(`/api/partner/bookings/${id}/accept`);
      setBookings((prev) => prev.filter((b) => b._id !== id));
      notifyBadge();
      router.push(`/partner/bookings?bookingId=${id}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        const code = error.response?.data?.code;
        const msg  = error.response?.data?.message;
        if (code === "DEPOSIT_REQUIRED")
          setActionError("Caution non versée — déposez 500 MAD pour activer votre compte.");
        else if (code === "WALLET_SUSPENDED")
          setActionError("Wallet suspendu — rechargez votre solde pour continuer.");
        else
          setActionError(msg || "Impossible d'accepter cette demande.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (actionLoading) return;
    try {
      setActionLoading(id);
      await axios.post(`/api/partner/bookings/${id}/reject`);
      setBookings((prev) => prev.filter((b) => b._id !== id));
      notifyBadge();
    } catch (error) {
      console.log(error);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(()=>{
    const socket =getSocket()
    socket.on("new-booking", (data) => {
      // Beep sonore
      try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
      } catch {}
      // Redirection automatique vers le trajet actif
      router.push(`/partner/active-ride?bookingId=${data.bookingId}`);
    })
      return ()=>{
        socket.off("new-booking")
      }
  },[])

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-semibold text-gray-900">
            Demandes de trajets
          </h1>
          <p className="mt-3 text-gray-500 text-lg">
            Gérer les demandes de courses entrantes et y répondre en temps réel
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {actionError && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-5 py-4">
            <span className="shrink-0">⚠</span>
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-700 font-bold">✕</button>
          </div>
        )}
        {loading ? (
          <div>
            <Loader2 className="animate-spin w-8 text-gray-700" />
          </div>
        ) : bookings.length == 0 ? (
          <div
            className="bg-white rounded-2xl border border-gray-200 p-16 text-center
               shadow-sm"
          >
            <p className="text-gray-500 text-lg">
              Aucune demande de trajet en attente
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm
                    hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

                  <div className="flex-1 space-y-6">

                    <div className="flex gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg flex items-center
                      justify-center">
                        <MapPin size={18} className=""/>
                     
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400 mb-1">Lieu de prise en charge</p>
                      <p className="text-gray-900 font-medium">{b.pickUpAddress}</p>
                    </div>
                    </div>

                   <div className="flex gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg flex items-center
                      justify-center">
                        <Navigation size={18} className=""/>
                     
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400 mb-1">Lieu de dépôt</p>
                      <p className="text-gray-900 font-medium">{b.dropAddress}</p>
                    </div>
                   </div>

                   <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                     <Clock size={14} className="opacity-70"/>
                     <span className="font-medium">
                      {new Date(b.createdAt!).toLocaleString("fr-MA",{
                        day:"2-digit",
                        month:"short",
                        year:"numeric",
                        hour:"2-digit",
                        minute:"2-digit",
                      })}
                     </span>
                   </div>
                 </div> 

                 <div className="flex flex-col justify-between lg:items-end
                 gap-6 w-full lg:w-auto">

                  <div className="text-left lg:text-right">
                      <p className="text-sm tracking-wide text-gray-400
                      uppercase mb-1">Tarif estimé</p>
                      <div className="flex items-center gap-2 text-3xl font-bold
                      text-gray-900 lg:justify-end">
                       <span text-2xl="true"> MAD</span>{b.fare}
                      </div>
                  </div>

                  <div className="flex gap-4 w-full lg:w-auto">
                    <button
                      onClick={() => handleReject(b._id)}
                      disabled={actionLoading === b._id}
                      className="flex-1 lg:flex-none px-6 py-3 rounded-xl border border-gray-300
                      bg-white text-gray-700 hover:bg-gray-100 transition-all duration-200
                      active:scale-[0.98] disabled:opacity-50"
                    >
                      {actionLoading === b._id ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Rejeter"}
                    </button>
                    <button
                      onClick={() => handleAccept(b._id)}
                      disabled={actionLoading === b._id}
                      className="flex-1 lg:flex-none px-8 py-3 rounded-xl text-white
                      bg-black text-sm font-semibold hover:bg-gray-900 hover:shadow-lg
                      transition-all duration-200 active:scale-[0.98] disabled:opacity-50
                      flex items-center justify-center"
                    >
                      {actionLoading === b._id ? <Loader2 size={16} className="animate-spin" /> : "Accepter"}
                    </button>
                  </div>
                 </div>

              </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
