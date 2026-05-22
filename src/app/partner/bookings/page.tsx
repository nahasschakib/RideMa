"use client"
import React, { Suspense, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Bike, Car, Truck, MapPin, Navigation, Clock, CheckCircle,
  XCircle, Loader2, Star, Banknote, AlertCircle, PhoneCall,
  User as UserIcon, ArrowLeft,
} from "lucide-react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus =
  | "idle" | "requested" | "awaiting_payment" | "confirmed"
  | "started" | "completed" | "cancelled" | "rejected" | "expired"

type PaymentStatus = "pending" | "paid" | "cash" | "failed"

interface PopulatedUser  { _id: string; name?: string; email?: string }
interface PopulatedVehicle { _id: string; type?: string }

interface PartnerBooking {
  _id: string
  user: PopulatedUser
  driver: PopulatedUser
  vehicle: PopulatedVehicle
  pickUpAddress: string
  dropAddress: string
  fare: number
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  createdAt: string
}

interface ClientBooking {
  _id: string
  pickUpAddress: string
  dropAddress: string
  fare: number
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  vehicleType: string | null
  driverName: string | null
  driverMobileNumber: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VEHICLE_ICON: Record<string, React.ReactNode> = {
  car: <Car size={14} />, motorcycle: <Bike size={14} />,
  scooter: <Bike size={14} />, truck: <Truck size={14} />,
  bus: <Truck size={14} />, van: <Truck size={14} />,
}
const VEHICLE_LABEL: Record<string, string> = {
  car: "Voiture", motorcycle: "Moto", scooter: "Scooter",
  truck: "Camion", bus: "Bus", van: "Van", other: "Autre",
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  idle:             { label: "Inactif",         color: "bg-zinc-100 text-zinc-500" },
  requested:        { label: "En attente",       color: "bg-amber-50 text-amber-600 border border-amber-200" },
  awaiting_payment: { label: "Paiement attendu", color: "bg-blue-50 text-blue-600 border border-blue-200" },
  confirmed:        { label: "Confirmé",         color: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  started:          { label: "En cours",         color: "bg-zinc-900 text-white" },
  completed:        { label: "Terminé",          color: "bg-zinc-100 text-zinc-600" },
  cancelled:        { label: "Annulé",           color: "bg-red-50 text-red-500 border border-red-200" },
  rejected:         { label: "Refusé",           color: "bg-red-50 text-red-500 border border-red-200" },
  expired:          { label: "Expiré",           color: "bg-zinc-100 text-zinc-400" },
}

const ACTIVE: BookingStatus[] = ["requested", "awaiting_payment", "confirmed", "started"]
const TERMINAL: BookingStatus[] = ["completed", "cancelled", "rejected", "expired"]

// Étapes du stepper client (ordre chronologique)
const STEPS: { key: BookingStatus; label: string }[] = [
  { key: "requested",        label: "Demande" },
  { key: "awaiting_payment", label: "Accepté" },
  { key: "confirmed",        label: "Payé" },
  { key: "started",          label: "En course" },
  { key: "completed",        label: "Arrivé" },
]

function stepIndex(status: BookingStatus): number {
  const order: BookingStatus[] = ["requested", "awaiting_payment", "confirmed", "started", "completed"]
  const i = order.indexOf(status)
  return i === -1 ? 0 : i
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ─── CLIENT TRACKING VIEW ─────────────────────────────────────────────────────

function ClientTrackingView({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [booking, setBooking] = useState<ClientBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = async () => {
    try {
      const { data } = await axios.get(`/api/booking/${bookingId}`)
      setBooking(data.booking)
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        setError(err.response?.data?.message ?? "Impossible de charger le trajet.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [bookingId])

  // Poll toutes les 3s tant que le statut est actif
  useEffect(() => {
    if (!booking || !ACTIVE.includes(booking.bookingStatus)) return
    const id = setInterval(fetch, 3000)
    return () => clearInterval(id)
  }, [booking?.bookingStatus])

  if (loading) return (
    <div className="flex flex-1 items-center justify-center py-32">
      <Loader2 size={28} className="text-zinc-400 animate-spin" />
    </div>
  )

  if (error || !booking) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
      <AlertCircle size={28} className="text-zinc-400" />
      <p className="text-zinc-900 font-black">Trajet introuvable</p>
      <p className="text-zinc-400 text-sm font-medium">{error}</p>
      <button
        onClick={() => router.back()}
        className="mt-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5"
      >
        <ArrowLeft size={12} />Retour
      </button>
    </div>
  )

  const cfg      = STATUS_CONFIG[booking.bookingStatus]
  const step     = stepIndex(booking.bookingStatus)
  const isActive = ACTIVE.includes(booking.bookingStatus)
  const isFailed = booking.bookingStatus === "cancelled" ||
                   booking.bookingStatus === "rejected"  ||
                   booking.bookingStatus === "expired"
  const vehicleType = booking.vehicleType ?? "other"

  return (
    <div className="max-w-lg mx-auto">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-400
        hover:text-zinc-900 transition-colors mb-8"
      >
        <ArrowLeft size={13} />Retour
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-zinc-900" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Suivi</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Votre trajet</h1>
      </motion.div>

      {/* Statut principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl border border-zinc-200 overflow-hidden
        shadow-[0_4px_24px_rgba(0,0,0,0.07)] mb-4"
      >
        <div className={`h-1 ${isFailed ? "bg-red-400" : "bg-zinc-900"}`} />
        <div className="p-8 flex flex-col items-center text-center gap-5">

          {/* Icône animée */}
          <div className="relative">
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-zinc-700"
              />
            )}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center
                ${isFailed  ? "bg-zinc-100 border-2 border-zinc-200"
                : booking.bookingStatus === "completed" ? "bg-zinc-900"
                : "bg-zinc-900"}`}
            >
              {booking.bookingStatus === "completed"  && <Star      size={32} className="text-white" />}
              {isFailed                               && <XCircle   size={32} className="text-zinc-400" />}
              {booking.bookingStatus === "requested"  && <Loader2   size={28} className="text-white animate-spin" />}
              {(booking.bookingStatus === "awaiting_payment" ||
                booking.bookingStatus === "confirmed")       && <CheckCircle size={32} className="text-white" />}
              {booking.bookingStatus === "started"    && (
                VEHICLE_ICON[vehicleType]
                  ? <span className="text-white [&>svg]:size-7">{VEHICLE_ICON[vehicleType]}</span>
                  : <Car size={28} className="text-white" />
              )}
            </motion.div>
          </div>

          {/* Label */}
          <div>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black
            uppercase tracking-wide px-3 py-1 rounded-full mb-3 ${cfg.color}`}>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              {cfg.label}
            </span>
            <motion.h2
              key={booking.bookingStatus}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl font-black text-zinc-900 mb-1"
            >
              {booking.bookingStatus === "requested"        && "Recherche d'un conducteur..."}
              {booking.bookingStatus === "awaiting_payment" && "Conducteur accepté !"}
              {booking.bookingStatus === "confirmed"        && "Paiement confirmé"}
              {booking.bookingStatus === "started"          && "Trajet en cours"}
              {booking.bookingStatus === "completed"        && "Trajet terminé !"}
              {booking.bookingStatus === "cancelled"        && "Trajet annulé"}
              {booking.bookingStatus === "rejected"         && "Demande refusée"}
              {booking.bookingStatus === "expired"          && "Demande expirée"}
            </motion.h2>
            <p className="text-zinc-400 text-sm font-medium">
              {booking.bookingStatus === "requested"        && "En attente qu'un conducteur accepte..."}
              {booking.bookingStatus === "awaiting_payment" && "Préparation du paiement..."}
              {booking.bookingStatus === "confirmed"        && "Le conducteur arrive vers vous."}
              {booking.bookingStatus === "started"          && `En route vers ${booking.dropAddress}`}
              {booking.bookingStatus === "completed"        && "Merci d'avoir utilisé RideMa !"}
              {isFailed                                     && "Vous pouvez effectuer une nouvelle demande."}
            </p>
          </div>

          {/* Stepper */}
          {!isFailed && (
            <div className="flex items-center gap-0 w-full max-w-xs mt-2">
              {STEPS.map((s, i) => {
                const done    = i < step
                const current = i === step
                const last    = i === STEPS.length - 1
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors
                        ${done || current ? "bg-zinc-900" : "bg-zinc-200"}`}>
                        {done
                          ? <CheckCircle size={12} className="text-white" />
                          : current && isActive
                          ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          : <span className={`w-2 h-2 rounded-full ${current ? "bg-white" : "bg-zinc-400"}`} />
                        }
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wide whitespace-nowrap
                        ${done || current ? "text-zinc-900" : "text-zinc-400"}`}>
                        {s.label}
                      </span>
                    </div>
                    {!last && (
                      <div className={`flex-1 h-px mx-1 mb-3.5 transition-colors
                        ${done ? "bg-zinc-900" : "bg-zinc-200"}`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Conducteur */}
      {(booking.driverName || booking.driverMobileNumber) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
          className="bg-white rounded-3xl border border-zinc-200 overflow-hidden
          shadow-[0_2px_12px_rgba(0,0,0,0.05)] mb-4"
        >
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center">
                <UserIcon size={16} className="text-zinc-500" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Conducteur</p>
                <p className="text-sm font-black text-zinc-900">{booking.driverName ?? "—"}</p>
              </div>
            </div>
            {booking.driverMobileNumber && (
              <a
                href={`tel:${booking.driverMobileNumber}`}
                className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center
                hover:bg-black transition-colors"
              >
                <PhoneCall size={15} className="text-white" />
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Itinéraire + tarif */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-white rounded-3xl border border-zinc-200 overflow-hidden
        shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
      >
        <div className="bg-zinc-50 border-b border-zinc-100 overflow-hidden">
          <div className="flex gap-3 px-6 py-4 border-b border-zinc-100">
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-white ring ring-zinc-300" />
              <div className="w-px flex-1 bg-zinc-300 my-1" style={{ minHeight: 12 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Départ</p>
              <p className="text-sm font-semibold text-zinc-900 truncate">{booking.pickUpAddress}</p>
            </div>
            <MapPin size={13} className="text-zinc-400 shrink-0 mt-1" />
          </div>
          <div className="flex gap-3 px-6 py-4">
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-white ring ring-zinc-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Arrivée</p>
              <p className="text-sm font-semibold text-zinc-900 truncate">{booking.dropAddress}</p>
            </div>
            <Navigation size={13} className="text-zinc-400 shrink-0 mt-1" />
          </div>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            {VEHICLE_ICON[vehicleType] ?? <Car size={13} />}
            <span>{VEHICLE_LABEL[vehicleType] ?? vehicleType}</span>
            <span className="mx-1">·</span>
            <Banknote size={11} />
            <span>{booking.paymentStatus}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black text-zinc-400">MAD</span>
            <span className="text-2xl font-black text-zinc-900">{booking.fare}</span>
          </div>
        </div>
      </motion.div>

    </div>
  )
}

// ─── PARTNER BOOKING CARD ─────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: PartnerBooking }) {
  const cfg = STATUS_CONFIG[booking.bookingStatus]
  const vehicleType = booking.vehicle?.type ?? "other"
  const isActive = ACTIVE.includes(booking.bookingStatus)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-3xl border border-zinc-200 overflow-hidden
      shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600">
              {VEHICLE_ICON[vehicleType] ?? <Car size={14} />}
            </div>
            <div>
              <p className="text-xs font-black text-zinc-900">
                {VEHICLE_LABEL[vehicleType] ?? vehicleType}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium">
                {booking.user?.name ?? booking.user?.email ?? "Client"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${cfg.color}`}>
              {cfg.label}
            </span>
            {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
        </div>

        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl overflow-hidden mb-4">
          <div className="flex gap-3 px-4 py-3 border-b border-zinc-100">
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-white ring ring-zinc-300" />
              <div className="w-px flex-1 bg-zinc-300 my-1" style={{ minHeight: 10 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Départ</p>
              <p className="text-xs font-semibold text-zinc-900 truncate">{booking.pickUpAddress}</p>
            </div>
            <MapPin size={12} className="text-zinc-400 shrink-0 mt-1" />
          </div>
          <div className="flex gap-3 px-4 py-3">
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-white ring ring-zinc-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Arrivée</p>
              <p className="text-xs font-semibold text-zinc-900 truncate">{booking.dropAddress}</p>
            </div>
            <Navigation size={12} className="text-zinc-400 shrink-0 mt-1" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-zinc-300 font-medium">{formatDate(booking.createdAt)}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-black text-zinc-400">MAD</span>
            <span className="text-lg font-black text-zinc-900">{booking.fare}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── PARTNER BOOKINGS LIST ────────────────────────────────────────────────────

function PartnerBookingsList() {
  const [bookings, setBookings] = useState<PartnerBooking[]>([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState<string | null>(null)

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get("/api/partner/bookings")
      setBookings(data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        setError(err.response?.data?.message ?? "Erreur lors du chargement.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  useEffect(() => {
    const hasActive = bookings.some(b => ACTIVE.includes(b.bookingStatus))
    if (!hasActive) return
    const id = setInterval(fetchBookings, 5000)
    return () => clearInterval(id)
  }, [bookings])

  const activeBookings   = bookings.filter(b => ACTIVE.includes(b.bookingStatus))
  const inactiveBookings = bookings.filter(b => !ACTIVE.includes(b.bookingStatus))

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-zinc-900" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Partenaire</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Mes trajets</h1>
        <p className="text-zinc-400 text-sm mt-1.5 font-medium">
          {loading ? "Chargement..." : `${bookings.length} trajet${bookings.length !== 1 ? "s" : ""}`}
        </p>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50
          border border-red-100 rounded-2xl px-4 py-3 mb-6">
          <AlertCircle size={13} className="shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="text-zinc-400 animate-spin" />
        </div>
      )}

      {!loading && bookings.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center gap-3"
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-200 flex items-center justify-center">
            <Star size={24} className="text-zinc-400" />
          </div>
          <p className="text-zinc-900 font-black text-lg">Aucun trajet</p>
          <p className="text-zinc-400 text-sm font-medium">Vos trajets apparaîtront ici.</p>
        </motion.div>
      )}

      <AnimatePresence>
        {!loading && activeBookings.length > 0 && (
          <motion.div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              En cours
            </p>
            <div className="space-y-4">
              {activeBookings.map(b => <BookingCard key={b._id} booking={b} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && inactiveBookings.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-4">Historique</p>
          <div className="space-y-4">
            {inactiveBookings.map(b => <BookingCard key={b._id} booking={b} />)}
          </div>
        </div>
      )}
    </>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function BookingsContent() {
  const params    = useSearchParams()
  const bookingId = params.get("bookingId")

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {bookingId
          ? <ClientTrackingView bookingId={bookingId} />
          : <PartnerBookingsList />
        }
      </div>
    </div>
  )
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <Loader2 size={28} className="text-zinc-400 animate-spin" />
      </div>
    }>
      <BookingsContent />
    </Suspense>
  )
}
