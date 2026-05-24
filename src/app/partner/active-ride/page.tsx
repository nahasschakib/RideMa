"use client"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"
import { Car, Loader2, MapPin, Phone } from "lucide-react"
import { BookingStatus, PaymentStatus } from "@/models/booking.model"

const MapView = dynamic(() => import("./MapView"), { ssr: false })

interface IActiveBooking {
  _id: string
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  fare: number
  pickUpAddress: string
  dropAddress: string
  pickUpLocation: { type: "Point"; coordinates: [number, number] }
  dropLocation: { type: "Point"; coordinates: [number, number] }
  user: { _id: string; name: string; email: string }
  userMobileNumber: string
  vehicle: { type: string; model: string; number: string }
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmée",
  started: "En cours",
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  started: "bg-zinc-900 text-white",
}

const PAYMENT_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé en ligne",
  cash: "Espèces",
  failed: "Échoué",
}

export default function ActiveRidePage() {
  const router = useRouter()
  const [booking, setBooking] = useState<IActiveBooking | null | undefined>(undefined)
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const watchRef = useRef<number | null>(null)

  const fetchActive = async () => {
    try {
      const { data } = await axios.get<IActiveBooking | null>("/api/partner/my-active")
      if (!data) {
        router.replace("/partner/pending-requests")
        return
      }
      setBooking(data)
    } catch {
      // silencieux — on réessaie au prochain poll
    }
  }

  useEffect(() => {
    fetchActive()
    intervalRef.current = setInterval(fetchActive, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!navigator.geolocation) return
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => setDriverPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    )
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  const handleAction = async () => {
    if (!booking) return
    setActionLoading(true)
    setActionError(null)
    try {
      if (booking.bookingStatus === "confirmed") {
        await axios.post(`/api/booking/${booking._id}/start`)
        setBooking((b) => (b ? { ...b, bookingStatus: "started" } : b))
      } else if (booking.bookingStatus === "started") {
        await axios.post(`/api/booking/${booking._id}/complete`)
        router.replace("/partner/pending-requests")
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setActionError(err.response?.data?.message ?? "Erreur lors de l'action")
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (booking === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-100">
        <Loader2 className="animate-spin w-8 h-8 text-zinc-400" />
      </div>
    )
  }

  if (!booking) return null

  const pickupPos: [number, number] = [
    booking.pickUpLocation.coordinates[1],
    booking.pickUpLocation.coordinates[0],
  ]
  const dropPos: [number, number] = [
    booking.dropLocation.coordinates[1],
    booking.dropLocation.coordinates[0],
  ]

  const initials = booking.user?.name
    ? booking.user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-zinc-100">
      {/* Carte */}
      <div className="flex-1 h-64 lg:h-full">
        <MapView driverPos={driverPos} pickupPos={pickupPos} dropPos={dropPos} />
      </div>

      {/* Panneau infos */}
      <div className="w-full lg:w-96 bg-white flex flex-col overflow-y-auto shadow-2xl">
        {/* En-tête client */}
        <div className="bg-linear-to-br from-zinc-900 to-zinc-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold truncate">
                  {booking.user?.name ?? "Client"}
                </h2>
                <span
                  className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                    STATUS_COLORS[booking.bookingStatus] ?? "bg-white/10 text-white"
                  }`}
                >
                  {STATUS_LABELS[booking.bookingStatus] ?? booking.bookingStatus}
                </span>
              </div>
              {booking.userMobileNumber && (
                <a
                  href={`tel:${booking.userMobileNumber}`}
                  className="mt-1.5 flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {booking.userMobileNumber}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Véhicule */}
        {booking.vehicle && (
          <div className="mx-4 mt-4 bg-zinc-50 border border-zinc-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="text-sm text-zinc-700">
              <span className="font-medium">{booking.vehicle.model ?? "—"}</span>
              {" · "}
              <span className="text-zinc-500">{booking.vehicle.number ?? "—"}</span>
            </div>
          </div>
        )}

        {/* Itinéraire */}
        <div className="mx-4 mt-4 space-y-1">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                Départ
              </p>
              <p className="text-sm text-zinc-700 mt-0.5 leading-relaxed">
                {booking.pickUpAddress}
              </p>
            </div>
          </div>

          <div className="ml-3.5 border-l-2 border-dashed border-zinc-200 h-5" />

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-7 h-7 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                Arrivée
              </p>
              <p className="text-sm text-zinc-700 mt-0.5 leading-relaxed">
                {booking.dropAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Tarif & paiement */}
        <div className="mx-4 mt-4 bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Mode paiement</p>
            <p className="text-sm font-medium text-zinc-700 mt-0.5">
              {PAYMENT_LABELS[booking.paymentStatus] ?? booking.paymentStatus}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Tarif</p>
            <p className="text-2xl font-black text-zinc-900">
              {booking.fare}
              <span className="text-xs font-semibold text-zinc-400 ml-1">MAD</span>
            </p>
          </div>
        </div>

        {/* Bouton action */}
        <div className="mx-4 mt-4 mb-6">
          {actionError && (
            <p className="text-red-500 text-sm mb-3 text-center">{actionError}</p>
          )}
          <button
            onClick={handleAction}
            disabled={actionLoading}
            className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              booking.bookingStatus === "confirmed"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-zinc-900 hover:bg-black"
            }`}
          >
            {actionLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : booking.bookingStatus === "confirmed" ? (
              "Démarrer le trajet"
            ) : (
              "Terminer le trajet"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
