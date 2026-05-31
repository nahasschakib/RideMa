"use client";

import React, { useEffect, useState } from "react";
import { BookingStatus, PaymentStatus } from "@/models/booking.model";
import { IVehicle } from "@/models/vehicle.model";
import axios, { AxiosError } from "axios";
import {
  Bike,
  Calendar,
  Car,
  ChevronRightIcon,
  Loader2,
  MapPin,
  Phone,
  Truck,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { IUser } from "../../../../types/user";
import { useRouter } from "next/navigation";

interface IBooking {
  _id: string;
  user: IUser;
  driver: IUser;
  vehicle: IVehicle;
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
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentDeadline: Date;
  adminCommission: number;
  partnerAmount: number;
  pickUpOtp: string;
  pickUpOtpExpires: Date;
  dropOtp: string;
  dropOtpExpires: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mapping statuts français → valeurs DB
const STATUS_OPTIONS: Record<string, string> = {
  Toutes: "All",
  Demandée: "requested",
  "En attente de paiement": "awaiting_payment",
  Confirmée: "confirmed",
  Commencée: "started",
  Terminée: "completed",
  Annulée: "cancelled",
  Rejetée: "rejected",
  Expirée: "expired",
};

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-amber-50 text-amber-600 border border-amber-200",
  awaiting_payment: "bg-blue-50 text-blue-600 border border-blue-200",
  confirmed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  started: "bg-zinc-900 text-white",
  completed: "bg-teal-50 text-teal-600 border border-teal-200",
  cancelled: "bg-red-50 text-red-500 border border-red-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
  expired: "bg-gray-50 text-gray-600 border border-gray-200",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé en ligne",
  cash: "Espèces",
  failed: "Échoué",
};

const STATUS_LABELS: Record<string, string> = {
  requested: "Demandée",
  awaiting_payment: "En attente paiement",
  confirmed: "Confirmée",
  started: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
  rejected: "Rejetée",
  expired: "Expirée",
};

function getVehicleIcon(vehicleType?: string) {
  switch (vehicleType?.toLowerCase()) {
    case "bike":
    case "motocycle":
    case "scooter":
      return <Bike className="w-4 h-4 text-gray-400" />;
    case "truck":
    case "bus":
    case "van":
      return <Truck className="w-4 h-4 text-gray-400" />;
    case "car":
    default:
      return <Car className="w-4 h-4 text-gray-400" />;
  }
}

export default function Page() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [selectStatus, setSelectStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router =useRouter()

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get("/api/partner/bookings");
        setBookings(data);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message ?? "Erreur lors du chargement.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", " à");
  };

  const filterBookings =
    selectStatus === "All"
      ? bookings
      : bookings.filter((b) => b.bookingStatus === selectStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto py-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Réservations partenaires
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {bookings.length}{" "}
                  {bookings.length === 1 ? "Trajet" : "Trajets"} qui vous est
                  attribué
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Filtre */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              Affichage {filterBookings.length} réservations
            </div>
            <select
              value={selectStatus}
              onChange={(e) => setSelectStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(STATUS_OPTIONS).map(([label, value]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Erreur */}
          {error && (
            <div
              className="bg-red-50 border border-red-100 text-red-500 text-sm
              rounded-xl px-4 py-3 mb-4"
            >
              {error}
            </div>
          )}

          {/* Chargement */}
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin w-8 h-8 text-black" />
            </div>
          )}

          {/* Vide */}
          {!loading && filterBookings.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h2 className="text-lg font-medium text-gray-900">
                Aucune réservation pour le moment
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Lorsque les clients réservent des courses, celles-ci
                apparaîtront ici.
              </p>
            </div>
          )}

          {/* Liste */}
          {!loading && filterBookings.length > 0 && (
            <div className="space-y-4">
              {filterBookings.map((b, i) => (
                <motion.div
                  key={b._id ?? i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    {/* Header card */}
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-200 shrink-0 border-2 border-white shadow-sm flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {b.user?.name?.toUpperCase() ?? "Client"}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium
                              ${STATUS_COLORS[b.bookingStatus] ?? "bg-gray-50 text-gray-700"}`}
                          >
                            {STATUS_LABELS[b.bookingStatus] ?? b.bookingStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{b.userMobileNumber ?? "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Véhicule */}
                    <div className="px-4 pt-3">
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                        {getVehicleIcon(b.vehicle?.type)}
                        <div className="text-xs text-gray-600">
                          {b.vehicle?.model ?? "—"} &bull;{" "}
                          {b.vehicle?.number ?? "Non assigné"}
                        </div>
                      </div>
                    </div>

                    {/* Itinéraire */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-green-600 uppercase tracking-wider">
                            Départ
                          </span>
                          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                            {b.pickUpAddress ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-red-600 uppercase tracking-wider">
                            Arrivée
                          </span>
                          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                            {b.dropAddress ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className=" flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(b.createdAt?.toString() ?? "")}</span>
                      </div>
                      <div className="flex items-baseline gap-1 font-semibold text-gray-900">
                        <span className="text-xs font-black text-gray-400">
                          MAD
                        </span>
                        <span className="text-lg font-black text-gray-900">
                          {b.fare}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Paiment:</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            b.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {PAYMENT_LABELS[b.paymentStatus] ?? b.paymentStatus}
                        </span>
                      </div>
                      {( b.bookingStatus === "completed" || b.bookingStatus === "confirmed" || b.bookingStatus === "started") && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push("/partner/active-ride")}
                            className="flex items-center gap-1 text-sm font-medium
                             text-blue-700 hover:text-blue-70 bg-blue-100 hover:bg-blue-100 transition-colors px-4 py-1.5 rounded-lg"
                          >
                            <span className="text-xs text-blue-700">Details</span>
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                   

                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
