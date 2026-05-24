"use client"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"
import { getSocket } from "@/lib/socket"
import { Car, Loader2, MapPin, Phone, Star } from "lucide-react"
import { BookingStatus } from "@/models/booking.model"

const MapView = dynamic(() => import("./MapView"), { ssr: false })

interface IBookingDetail {
  _id: string
  bookingStatus: BookingStatus
  pickUpAddress: string
  dropAddress: string
  pickUpLocation: { type: "Point"; coordinates: [number, number] }
  dropLocation: { type: "Point"; coordinates: [number, number] }
  fare: number
  driverName: string | null
  driverMobileNumber: string | null
  vehicleType: string | null
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Conducteur en route",
  started:   "Trajet en cours",
  completed: "Trajet terminé",
}

function ActiveRideContent() {
  const params = useSearchParams()
  const router = useRouter()
  const bookingId = params.get("bookingId")

  const [booking, setBooking] = useState<IBookingDetail | null>(null)
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchBooking = async () => {
    if (!bookingId) return
    try {
      const { data } = await axios.get(`/api/booking/${bookingId}`)
      if (data.booking) setBooking(data.booking)
    } catch {}
  }

  useEffect(() => {
    if (!bookingId) { router.replace("/"); return }
    fetchBooking().finally(() => setLoading(false))
    intervalRef.current = setInterval(fetchBooking, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [bookingId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const socket = getSocket()
    socket.on("location-update", ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      setDriverPos([latitude, longitude])
    })
    return () => { socket.off("location-update") }
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-100">
        <Loader2 className="animate-spin w-8 h-8 text-zinc-400" />
      </div>
    )
  }

  if (!booking || !booking.pickUpLocation || !booking.dropLocation) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Réservation introuvable.</p>
      </div>
    )
  }

  const pickupPos: [number, number] = [
    booking.pickUpLocation.coordinates[1],
    booking.pickUpLocation.coordinates[0],
  ]
  const dropPos: [number, number] = [
    booking.dropLocation.coordinates[1],
    booking.dropLocation.coordinates[0],
  ]

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-zinc-100">
      {/* Carte */}
      <div className="flex-1 h-64 lg:h-full">
        <MapView driverPos={driverPos} pickupPos={pickupPos} dropPos={dropPos} />
      </div>

      {/* Panneau infos */}
      <div className="w-full lg:w-96 bg-white flex flex-col overflow-y-auto shadow-2xl">
        {/* En-tête conducteur */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
              <Car className="w-7 h-7 text-white/80" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">
                {booking.driverName ?? "Conducteur"}
              </h2>
              <p className="text-sm text-white/70 mt-0.5">
                {STATUS_LABELS[booking.bookingStatus] ?? booking.bookingStatus}
              </p>
              {booking.driverMobileNumber && (
                <a
                  href={`tel:${booking.driverMobileNumber}`}
                  className="mt-1.5 flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {booking.driverMobileNumber}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Itinéraire */}
        <div className="mx-4 mt-4 space-y-1">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Départ</p>
              <p className="text-sm text-zinc-700 mt-0.5 leading-relaxed">{booking.pickUpAddress}</p>
            </div>
          </div>
          <div className="ml-3.5 border-l-2 border-dashed border-zinc-200 h-5" />
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-7 h-7 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Arrivée</p>
              <p className="text-sm text-zinc-700 mt-0.5 leading-relaxed">{booking.dropAddress}</p>
            </div>
          </div>
        </div>

        {/* Tarif */}
        <div className="mx-4 mt-4 bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-center justify-between">
          <p className="text-xs text-zinc-500">Tarif total</p>
          <p className="text-2xl font-black text-zinc-900">
            {booking.fare}
            <span className="text-xs font-semibold text-zinc-400 ml-1">MAD</span>
          </p>
        </div>

        {/* Statut */}
        <div className="mx-4 mt-4 mb-6">
          {booking.bookingStatus === "completed" ? (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
              <Star className="w-5 h-5 text-teal-600 shrink-0" />
              <p className="text-sm font-medium text-teal-700">
                Trajet terminé. Merci d&apos;avoir utilisé RideMa !
              </p>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="animate-spin w-4 h-4 shrink-0" />
              Mise à jour en temps réel...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-zinc-100">
        <Loader2 className="animate-spin w-8 h-8 text-zinc-400" />
      </div>
    }>
      <ActiveRideContent />
    </Suspense>
  )
}
