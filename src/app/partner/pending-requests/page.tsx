"use client";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { BookingStatus, PaymentStatus } from "@/models/booking.model";
import { Clock, Loader2, MapPin, Navigation } from "lucide-react";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/partner/bookings/pending");
        setBookings(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, []);

  const handleAccept = async (id: string) => {
    if (actionLoading) return;
    try {
      setActionLoading(id);
      await axios.get(`/api/partner/bookings/${id}/accept`);
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (error) {
      console.log(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (actionLoading) return;
    try {
      setActionLoading(id);
      await axios.get(`/api/partner/bookings/${id}/reject`);
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (error) {
      console.log(error);
    } finally {
      setActionLoading(null);
    }
  };
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
