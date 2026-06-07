"use client"
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"
import { AlertCircle, ArrowRight, Banknote, Bike, Car, CheckCircle, Clock, CreditCard, Globe, Loader2, LucideIcon, MapPin, Navigation, PhoneCall, Shield, Star, Truck, Wallet, XCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios, { AxiosError } from 'axios'
import { getSocket } from '@/lib/socket'

const VEHICLE_META: Record<string, { label: string; Icon: LucideIcon }> = {
  car:        { label: "Voiture", Icon: Car   },
  motocycle: { label: "Moto",    Icon: Bike  },
  scooter:    { label: "Scooter", Icon: Bike  },
  vélo:       { label: "Vélo",    Icon: Bike  },
  truck:      { label: "Camion",  Icon: Truck },
  bus:        { label: "Bus",     Icon: Truck },
  van:        { label: "Van",     Icon: Truck },
  other:      { label: "Autre",   Icon: Car   },
}

type Status = "idle" | "requested" | "awaiting_payment" |"payment" | "confirmed" | "started" | "cancelled" | "completed" | "rejected" | "expired"

const ACTIVE_STATUSES: Status[] = ["requested", "awaiting_payment", "confirmed", "started"]

function CheckoutContent() {
  const params = useSearchParams()
  const pickup     = params.get("pickup")   || ""
  const drop       = params.get("drop")     || ""
  const mobile     = params.get("mobile")
  const vehicle    = params.get("vehicle")  || ""
  const fare       = params.get("fare")     || ""
  const pickUpLat  = Number(params.get("pickUpLat"))
  const pickUpLong = Number(params.get("pickUpLong"))
  const dropLat    = Number(params.get("dropLat"))
  const dropLong   = Number(params.get("dropLong"))
  const router = useRouter()
  const bookingIdParam = params.get("bookingId")
  const paymentParam   = params.get("payment")

  const saved = useMemo(() => {
    if (typeof window === "undefined") return {}
    try { return JSON.parse(sessionStorage.getItem("selectedVehicle") ?? "{}") }
    catch { return {} }
  }, [])

  const driverId  = params.get("driverId")  || saved.driverId  || ""
  const vehicleId = params.get("vehicleId") || saved.vehicleId || ""

  const [restoredData, setRestoredData] = useState<{ pickup: string; drop: string; fare: string; vehicle: string } | null>(null)
  const [status,      setStatus]      = useState<Status>("idle")
  const [bookingId,   setBookingId]   = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "cmi" | "stripe" | null>("cash")
  const [loading,     setLoading]     = useState(false)
  const [initializing,setInitializing]= useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const displayPickup  = restoredData?.pickup  ?? pickup
  const displayDrop    = restoredData?.drop    ?? drop
  const displayFare    = restoredData?.fare    ?? fare
  const displayVehicle = restoredData?.vehicle ?? vehicle
  const { Icon } = VEHICLE_META[displayVehicle] ?? { Icon: Car }

  // Fetch active booking once on mount
  useEffect(() => {
    axios.get("/api/booking/active")
      .then(({ data }) => {
        if (data.booking) {
          setBookingId(data.booking._id)
          setStatus(data.booking.bookingStatus as Status)
          if (data.booking?.paymentMethod) {
            setPaymentMethod(data.booking.paymentMethod)
          }
        }
      })
      .catch(() => {})
      .finally(() => setInitializing(false))
  }, [])

  // Poll every 3s while booking is in an active state
  useEffect(() => {
    if (status === "idle" || !ACTIVE_STATUSES.includes(status)) return
    const id = setInterval(() => {
      axios.get("/api/booking/active")
        .then(({ data }) => {
          if (data.booking) {
            setBookingId(data.booking._id)
            setStatus(prev => {
              const incoming = data.booking.bookingStatus as Status
              if (prev === "payment" && incoming === "awaiting_payment") return prev
              return incoming
            })
          } else {
            setStatus(prev => {
              if (prev === "idle") return prev
              if (prev === "started") return "completed"
              const TERMINAL: Status[] = ["cancelled", "completed", "expired", "rejected"]
              return TERMINAL.includes(prev) ? prev : "idle"
            })
            setBookingId(null)
          }
        })
        .catch(() => {})
    }, 3000)
    return () => clearInterval(id)
  }, [status])

  // Restaure les données du trajet quand l'utilisateur revient de Stripe/CMI
  useEffect(() => {
    if (!bookingIdParam || paymentParam !== "success") return
    axios.get(`/api/booking/${bookingIdParam}`)
      .then(({ data }) => {
        if (!data.booking) return
        setBookingId(data.booking._id)
        setStatus(data.booking.bookingStatus as Status)
        setRestoredData({
          pickup:  data.booking.pickUpAddress,
          drop:    data.booking.dropAddress,
          fare:    String(data.booking.fare),
          vehicle: data.booking.vehicleType ?? "",
        })
      })
      .catch(() => {})
  }, [bookingIdParam, paymentParam])

  useEffect(() => {
    if (status !== "awaiting_payment" || !bookingId) return;
    if (paymentMethod === "cash") {
      axios.post(`/api/booking/${bookingId}/confirm-payment`, { paymentMethod: "cash" })
        .then(() => setStatus("confirmed"))
        .catch(() => setStatus("payment"));
    } else {
      const t = setTimeout(() => setStatus("payment"), 3000);
      return () => clearTimeout(t);
    }
  }, [status, bookingId, paymentMethod]);

  useEffect(() => {
    if ((status === "confirmed" || status === "started") && bookingId) {
      router.replace(`/user/ride/${bookingId}`)
    }
  }, [status, bookingId]) // eslint-disable-line

    useEffect(()=>{
      const socket =getSocket()
      socket.on("accept_booking",(data)=>{
        setStatus(data)
        })
        socket.on("reject_booking",(data)=>{
        setStatus(data)
        })
        return ()=>{
          socket.off("accept_booking")
          socket.off("reject_booking")
        }
    },[])

  const handleRequest = async () => {
    if (!driverId || !vehicleId) {
      setError("Informations du véhicule manquantes. Retournez à la sélection.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post("/api/booking/create", {
        driverId,
        vehicleId,
        pickUpAddress:  pickup,
        dropAddress:    drop,
        pickUpLocation: { type: "Point", coordinates: [pickUpLong, pickUpLat] },
        dropLocation:   { type: "Point", coordinates: [dropLong,   dropLat]  },
        fare:           Number(fare),
        mobileNumber:   mobile,
        paymentMethod,
      }, { timeout: 10000 })
      setBookingId(data._id)
      setStatus((data.bookingStatus ?? "requested") as Status)
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = err.response?.data?.message || "Une erreur est survenue. Veuillez réessayer."
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!paymentMethod || !bookingId) return
    setLoading(true)
    setError(null)
    try {
      if (paymentMethod === "cash") {
        await axios.post(`/api/booking/${bookingId}/confirm-payment`, { paymentMethod })
        setStatus("confirmed")
        return
      }

      if (paymentMethod === "stripe") {
        const { data } = await axios.post("/api/payment/stripe/create-session", { bookingId })
        window.location.href = data.url
        return
      }

      if (paymentMethod === "cmi") {
        const { data } = await axios.post("/api/payment/cmi/initiate", { bookingId })
        // Construire et soumettre le formulaire CMI dynamiquement
        const form = document.createElement("form")
        form.method = "POST"
        form.action = data.gatewayUrl
        Object.entries(data.params as Record<string, string>).forEach(([key, value]) => {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = value
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
        return
      }
    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data?.message || "Erreur lors de la confirmation du paiement.")
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      await axios.post(`/api/booking/${bookingId}/cancel`)
      setStatus("idle")
      setBookingId(null)
    } catch {
      setError("Impossible d'annuler la réservation.")
    }
  }

  const handleReset = () => {
    setStatus("idle")
    setBookingId(null)
    setError(null)
  }

 

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-12">
      <div className="relative max-w-6xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-zinc-900" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Réservation</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Vérification</h1>
          <p className="text-zinc-400 text-sm mt-1.5 font-medium">Vérifiez votre trajet et confirmez.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Résumé du trajet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
          >
            <div className="h-1 bg-zinc-900" />
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-1">Véhicule sélectionné</div>
                  <div className="text-3xl font-black tracking-tight text-zinc-900">
                    {VEHICLE_META[displayVehicle]?.label ?? displayVehicle}
                    </div>
                </div>
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <Icon size={28} className="text-white" />
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl overflow-hidden mb-2">
                <div className="flex gap-4 px-5 py-4 border-b border-zinc-100">
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white ring ring-zinc-300" />
                    <div className="w-px flex-1 bg-zinc-300 my-1" style={{ minHeight: 12 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-0.5">Point de départ</div>
                    <div className="text-sm font-semibold text-zinc-900 leading-snug truncate">{displayPickup}</div>
                  </div>
                  <MapPin size={14} className="text-zinc-400 shrink-0 mt-1" />
                </div>
                <div className="flex gap-4 px-5 py-4">
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white ring ring-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-0.5">Point d&apos;arrivée</div>
                    <div className="text-sm font-semibold text-zinc-900 leading-snug truncate">{displayDrop}</div>
                  </div>
                  <Navigation size={14} className="text-zinc-400 shrink-0 mt-1" />
                </div>
              </div>

              <div className="flex items-end justify-between pt-6 border-t border-zinc-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-1">Tarif total</p>
                  <p className="text-zinc-400 text-xs font-medium">Comprend les frais de base et de distance</p>
                </div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-zinc-400 text-lg font-black">MAD</span>
                  <span className="text-zinc-900 text-4xl font-black tracking-tight leading-none">{displayFare}</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Panneau d'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)] flex flex-col"
          >
            <div className="h-1 bg-zinc-900" />
            <div className="flex-1 p-8 sm:p-10 flex flex-col">

              {initializing ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">

                  {(status == "idle" || status == "rejected") && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col flex-1 justify-between"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-1">Prêt à partir</p>
                        <h3 className="text-2xl font-black text-zinc-900 mb-6">Confirmez votre trajet</h3>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 space-y-2">
                          {[
                            { icon: <Clock size={14} />,      text: "Le conducteur répondra dans les 2 minutes" },
                            { icon: <Shield size={14} />,     text: "Uniquement des conducteurs assurés" },
                            { icon: <CreditCard size={14} />, text: "Choisissez votre mode de paiement ci-dessous" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">{item.icon}</div>
                              <p className="text-zinc-500 text-xs font-medium">{item.text}</p>
                            </div>
                          ))}
                        </div>

                        {/* Sélecteur mode de paiement */}
                        <div className="mt-5 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-2">Mode de paiement</p>
                          {[
                            { value: "cash", label: "Espèces", description: "Payer le conducteur après le trajet" },
                            { value: "cmi", label: "Carte marocaine (CMI)", description: "Visa / Mastercard · banques marocaines" },
                            { value: "stripe", label: "Carte internationale", description: "Visa / Mastercard · paiement sécurisé Stripe" },
                          ].map((option) => (
                            <div
                              key={option.value}
                              onClick={() => setPaymentMethod(option.value as "cash" | "cmi" | "stripe")}
                              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                                paymentMethod === option.value
                                  ? "border-zinc-900 bg-zinc-900 text-white"
                                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-400"
                              }`}
                            >
                              <div className="flex-1">
                                <p className={`text-sm font-bold ${paymentMethod === option.value ? "text-white" : "text-zinc-800"}`}>
                                  {option.label}
                                </p>
                                <p className={`text-xs mt-0.5 ${paymentMethod === option.value ? "text-zinc-300" : "text-zinc-400"}`}>
                                  {option.description}
                                </p>
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === option.value ? "border-white" : "border-zinc-300"
                              }`}>
                                {paymentMethod === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </div>
                          ))}
                        </div>

                        {error && (
                          <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <AlertCircle size={13} className="shrink-0" />{error}
                          </div>
                        )}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        onClick={handleRequest}
                        disabled={loading}
                        className="w-full h-14 mt-8 bg-zinc-900 hover:bg-black disabled:opacity-40
                        text-white font-black text-sm rounded-2xl flex items-center justify-center
                        gap-2.5 transition-colors shadow-md"
                      >
                        {loading
                          ? <Loader2 size={18} className="animate-spin" />
                          : <><span>Demander un trajet</span><ArrowRight size={15} /></>
                        }
                      </motion.button>
                    </motion.div>
                  )}

                  {status === "requested" && (
                    <motion.div
                      key="requested"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col flex-1 items-center justify-center gap-6 text-center"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-zinc-900"
                        />
                        <div className="relative w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center">
                          <Loader2 size={28} className="text-zinc-900 animate-spin" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-zinc-900 mb-1">Recherche d&apos;un conducteur</h3>
                        <p className="text-zinc-400 text-sm font-medium">En attente que le chauffeur accepte...</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-400
                        hover:text-zinc-900 transition-colors border border-zinc-200
                        hover:border-zinc-400 px-4 py-2.5 rounded-xl"
                      >
                        <XCircle size={13} />Annuler la demande
                      </motion.button>
                      {error && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <AlertCircle size={13} className="shrink-0" />{error}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {status === "awaiting_payment" && (
                    <motion.div
                      key="awaiting_payment"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col flex-1 items-center justify-center gap-5 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 16 }}
                        className="w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center"
                      >
                        <CheckCircle size={36} className="text-zinc-900" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-black text-zinc-900 mb-1">Conducteur accepté</h3>
                        <p className="text-zinc-400 text-sm font-medium">Préparation du paiement...</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-400
                        hover:text-zinc-900 transition-colors border border-zinc-200
                        hover:border-zinc-400 px-4 py-2.5 rounded-xl"
                      >
                        <XCircle size={13} />Annuler la réservation
                      </motion.button>
                    </motion.div>
                  )}

                  {status === "payment" && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, y:12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col flex-1  gap-6"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 mb-1">Paiement en attente</p>
                        <h3 className="text-2xl font-black text-zinc-900 mb-4">Veuillez effectuer le paiement</h3>
                        <p className="text-zinc-400 text-sm font-medium mb-6">Aucun conducteur ne peut voir votre trajet tant que le paiement n&apos;est pas effectué.</p>
                      </div>
                      <div className='space-y-3'>
                        {[
                          { id: "cash",   Icon: Banknote, title: "Espèces",           sub: "Payer le conducteur après le trajet" },
                          { id: "cmi",    Icon: CreditCard, title: "Carte marocaine (CMI)", sub: "Visa / Mastercard · banques marocaines" },
                          { id: "stripe", Icon: Globe,    title: "Carte internationale", sub: "Visa / Mastercard · paiement sécurisé Stripe" },
                      ].map((p, i) => {
                        const active = paymentMethod === p.id
                          return (
                            <motion.div
                            key={p.id}
                            onClick={() => setPaymentMethod(p.id as "cash" | "cmi" | "stripe")}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left
                              transition-all duration-200 ${
                              active ? "border-zinc-900 bg-zinc-900" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                              transition-colors ${active ? "bg-white/10" :"bg-zinc-200"}`}><p.Icon size={18} className={
                                active ? "text-white" : "text-zinc-600"} /></div>
                            <div className='flex-1 min-w-0'>
                              <p className={`text-sm font-bold ${active ? "text-white" : "text-zinc-900"}`}>{p.title}</p>
                              <p className={`text-xs font-medium ${active ? "text-zinc-400" : "text-zinc-400"}`}>{p.sub}</p>
                            </div>
                            <AnimatePresence>
                              {active && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <CheckCircle size={16} className="text-white shrink-0" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            


                            </motion.div>
                          )
                        })}
                      </div>
                      {error && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <AlertCircle size={13} className="shrink-0" />{error}
                        </div>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={paymentMethod && !loading ? { scale: 1.02 } : {}}
                        onClick={handleConfirmPayment}
                        disabled={!paymentMethod || loading}
                        className="w-full h-14 bg-zinc-900 hover:bg-black disabled:opacity-40
                        text-white font-black text-sm rounded-2xl flex items-center justify-center
                        gap-2.5 transition-colors shadow-md mt-auto"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> :
                          paymentMethod === "cash"   ? <><Banknote size={16} /><span>Payer en espèces</span></> :
                          paymentMethod === "cmi"    ? <><CreditCard size={16} /><span>Payer avec CMI</span><ArrowRight size={15} /></> :
                          paymentMethod === "stripe" ? <><Globe size={16} /><span>Payer avec Stripe</span><ArrowRight size={15} /></> :
                          <span>Confirmer le paiement</span>
                        }
                      </motion.button>
                    </motion.div>
                  )}

                  {status === "confirmed" && (
                    <motion.div
                      key="confirmed"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col flex-1 items-center justify-center gap-5 text-center"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2.5, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-zinc-700"
                        />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 16 }}
                          className="relative w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center"
                        >
                          <CheckCircle size={32} className="text-white" />
                        </motion.div>
                      </div>
                      <div>
                        <motion.h3 
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 16 }}
                        className="text-xl font-black text-zinc-900 mb-1">Paiement confirmé</motion.h3>
                        <motion.p 
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 16 }}
                        className="text-zinc-400 text-sm font-medium max-w-xs">En attente que le conducteur démarre le trajet.</motion.p>
                      </div>
                      <motion.button
                       initial={{ opacity: 0, y:8 }}
                       animate={{ opacity: 1, y:0}}
                       transition={{delay:0.5}}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{scale:1.03}}
                       onClick={() => router.replace(`/user/ride/${bookingId}`)}
                        className="flex items-center gap-2 text-xs font-bold text-zinc-400
                        hover:text-zinc-900 transition-colors border border-zinc-200
                        hover:border-zinc-400 px-4 py-2.5 rounded-xl"
                      >
                        <XCircle size={13} />Suivez votre trajet...
                      </motion.button>
                    </motion.div>
                  )}

                  {status === "started" && (
                    <motion.div
                      key="started"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col flex-1 items-center justify-center gap-5 text-center"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2.5, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-zinc-700"
                        />
                        <div className="relative w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center">
                          <Icon size={28} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-zinc-900 mb-1">Trajet en cours</h3>
                        <p className="text-zinc-400 text-sm font-medium">Vers {displayDrop}</p>
                      </div>
                    </motion.div>
                  )}

                  {status === "completed" && (
                    <motion.div
                      key="completed"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col flex-1 items-center justify-center gap-5 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 16 }}
                        className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center"
                      >
                        <Star size={32} className="text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-black text-zinc-900 mb-1">Trajet terminé</h3>
                        <p className="text-zinc-400 text-sm font-medium">Merci d&apos;avoir utilisé MaRide !</p>
                      </div>
                    </motion.div>
                  )}

                  {(status === "cancelled" || status === "rejected") && (
                    <motion.div
                      key="cancelled"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col flex-1 items-center justify-center gap-5 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 16 }}
                        className="w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center"
                      >
                        <XCircle size={32} className="text-zinc-500" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-black text-zinc-900 mb-1">
                          {status === "rejected" ? "Demande refusée" : "Réservation annulée"}
                        </h3>
                        <p className="text-zinc-400 text-sm font-medium">Vous pouvez effectuer une nouvelle demande.</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={handleReset}
                        className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-black text-sm
                        rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-md"
                      >
                        <span>Nouvelle demande</span><ArrowRight size={15} />
                      </motion.button>
                    </motion.div>
                  )}

                  {status === "expired" && (
                    <motion.div
                      key="expired"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col flex-1 items-center justify-center gap-5 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 16 }}
                        className="w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center"
                      >
                        <Clock size={32} className="text-zinc-400" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-black text-zinc-900 mb-1">Demande expirée</h3>
                        <p className="text-zinc-400 text-sm font-medium">Aucun conducteur n&apos;a répondu à temps.</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={handleReset}
                        className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-black text-sm
                        rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-md"
                      >
                        <span>Réessayer</span><ArrowRight size={15} />
                      </motion.button>
                    </motion.div>
                  )}

                </AnimatePresence>
              )}

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
