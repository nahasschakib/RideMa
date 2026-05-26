"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios, { AxiosError } from "axios";
import { Car, Loader2, MapPin, Phone, Zap } from "lucide-react";
import { BookingStatus, PaymentStatus } from "@/models/booking.model";
import { getSocket } from "@/lib/socket";
import { motion } from "motion/react";
import PanelContent from "@/app/components/PanelContent";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface IActiveBooking {
  _id: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  fare: number;
  pickUpAddress: string;
  dropAddress: string;
  pickUpLocation: { type: "Point"; coordinates: [number, number] };
  dropLocation: { type: "Point"; coordinates: [number, number] };
  user: { _id: string; name: string; email: string };
  driver: { _id: string; name: string };
  userMobileNumber: string;
  vehicle: { type: string; model: string; number: string };
}

const STATUS_LABELS: Record<
  BookingStatus,
  { label: string; sublabel: string; dot: string }
> = {
  idle: {
    label: "En Attente de Confirmation",
    sublabel: "La réservation est en cours de traitement.",
    dot: "bg-amber-400",
  },
  requested: {
    label: "En Attente de Confirmation",
    sublabel: "La réservation est en cours de traitement.",
    dot: "bg-amber-400",
  },
  awaiting_payment: {
    label: "En Attente de Paiement",
    sublabel: "Paiement en Attente",
    dot: "bg-purple-400",
  },
  confirmed: {
    label: "Confirmée",
    sublabel: "La réservation est confirmée",
    dot: "bg-emerald-500",
  },
  started: {
    label: "En cours",
    sublabel: "Le trajet a commencé",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Terminée",
    sublabel: "Le trajet est terminé",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Annulée",
    sublabel: "La réservation a été annulée",
    dot: "bg-red-500",
  },
  rejected: {
    label: "Rejetée",
    sublabel: "La réservation a été rejetée",
    dot: "bg-red-500",
  },
  expired: {
    label: "Expirée",
    sublabel: "La réservation a expiré",
    dot: "bg-gray-500",
  },
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  started: "bg-zinc-900 text-white",
};

const PAYMENT_LABELS: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Payé en ligne", cls: "bg-emerald-100 text-emerald-700" },
  cash: { label: "Espèces", cls: "bg-zinc-100 text-zinc-700" },
  failed: { label: "Échoué", cls: "bg-red-100 text-red-700" },
};

export default function ActiveRidePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [booking, setBooking] = useState<IActiveBooking | null | undefined>(
    undefined,
  );
  const bookingRef = useRef<IActiveBooking | null>(null);
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);
  const [distanceToPickup, setDistanceToPickup] = useState(0);
  const [distanceToDrop, setDistanceToDrop] = useState(0);
  const [etaToPickup, setEtaToPickup] = useState(0);
  const [etaToDrop, setEtaToDrop] = useState(0);
  const [status, setStatus] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  useEffect(() => {
    bookingRef.current = booking ?? null;
  }, [booking]);

  const fetchActive = async () => {
    try {
      const { data } = await axios.get<IActiveBooking | null>(
        "/api/partner/my-active",
      );
      if (!data) {
        router.replace("/partner/pending-requests");
        return;
      }
      setBooking(data);
      setStatus(data.bookingStatus);
    } catch {
      // silencieux — on réessaie au prochain poll
    }
  };

  useEffect(() => {
    fetchActive();
    intervalRef.current = setInterval(fetchActive, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChatToggle=()=>{
    setChatOpen((prev)=>!prev);
  }
  useEffect(() => {
    if (!navigator.geolocation) return;
    const socket = getSocket();
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setDriverPos(coords);
        const b = bookingRef.current;
        if (session?.user?.id && b?.user?._id) {
          socket.emit("update-location", {
            userId: session.user.id,
            clientId: b.user._id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );
    return () => {
      if (watchRef.current !== null)
        navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async () => {
    if (!booking) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (booking.bookingStatus === "confirmed") {
        await axios.post(`/api/booking/${booking._id}/start`);
        setBooking((b) => (b ? { ...b, bookingStatus: "started" } : b));
      } else if (booking.bookingStatus === "started") {
        await axios.post(`/api/booking/${booking._id}/complete`);
        router.replace("/partner/pending-requests");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setActionError(
          err.response?.data?.message ?? "Erreur lors de l'action",
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (booking === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-100">
        <Loader2 className="animate-spin w-8 h-8 text-zinc-400" />
      </div>
    );
  }

  if (!booking) return null;

  const pickupPos: [number, number] = [
    booking.pickUpLocation.coordinates[1],
    booking.pickUpLocation.coordinates[0],
  ];
  const dropPos: [number, number] = [
    booking.dropLocation.coordinates[1],
    booking.dropLocation.coordinates[0],
  ];

  const initials = booking.user?.name
    ? booking.user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  const isActive = ["confirmed", "started"].includes(status);
  const canChat= booking.bookingStatus === "confirmed";
  const etaValue = isActive ? (status === "confirmed" ? etaToPickup : etaToDrop) : 0;
  const distanceValue = isActive ? (status === "confirmed" ? distanceToPickup : distanceToDrop) : 0;
  const paymentStatus = PAYMENT_LABELS[booking.paymentStatus ?? "pending"];

  const panelProps = {
    isActive,
    displayEta: etaValue,
    displayDistance: distanceValue,
    booking,
    paymentStatus,
    canChat,
    chatOpen,
    onChatToggle,
  }
 
  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-zinc-100">
      {/* Carte */}
      <div className="relative flex-1 h-full z-0">
        <MapView
          driverLocation={driverPos}
          pickupLocation={pickupPos}
          dropLocation={dropPos}
          mapStatus={booking.bookingStatus}
          onStats={({
            distanceToPickup,
            etaToPickup,
            distanceToDrop,
            etaToDrop,
          }) => {
            setDistanceToPickup(distanceToPickup);
            setEtaToPickup(etaToPickup);
            setDistanceToDrop(distanceToDrop);
            setEtaToDrop(etaToDrop);
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex w-105 xl:w-115 bg-white border-l mt-1 border-zinc-100 flex-col overflow-hidden"
      >
        <div className="bg-zinc-950 p-6 py-5 shrink-0">
          <p className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-semibold mb-1">
            Panneau du Conducteur
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-white text-xl font-bold">Trajet Actif</h1>
            {isActive && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <Zap size={12} className="text-amber-400" />
                <span className="text-white text-xs font-semibold">
                  {Math.round(etaValue)} min
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
<div className="flex-1 overflow-auto scrollbar-hide">
 <PanelContent {...panelProps} />
</div>
        </div>
      </motion.div>
    </div>
  );
}
