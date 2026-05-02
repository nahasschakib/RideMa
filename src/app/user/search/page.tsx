"use client";
import React, { useCallback, useState, Suspense, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Bike, Car, LucideIcon, MapPin, Navigation, RefreshCcw, Search, Truck, Zap } from "lucide-react";
import SearchMap from "@/app/components/SearchMap";
import axios from "axios";
import VehicleCard from "@/app/components/VehicleCard";
import { vehicleType } from "@/models/vehicle.model";



const VEHICLE_META: Record<string, { label: string; Icon: LucideIcon }> = {
  car:       { label: "Voiture",  Icon: Car   },
  motocycle: { label: "Moto",     Icon: Bike  },
  scooter:   { label: "Scooter",  Icon: Bike  },
  vélo:      { label: "Vélo",     Icon: Bike  },
  truck:     { label: "Camion",   Icon: Truck },
  bus:       { label: "Bus",      Icon: Truck },
  van:       { label: "Van",      Icon: Truck },
   other:      { label: "Autre",   Icon: Car },
};
 interface IVehicle {
    _id:string,
    owner:string,
    type:vehicleType,
    model:string,
    number:string,
    baseFare?:number,
    imageUrl?:string,
    pricePerKM?:number,
    waitingCharge?:number,
    status:"approved"|"rejected"|"pending",
    rejectionReason?:string,
    isActive:boolean,
    createdAt:Date,
    updatedAt:Date

}

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [pickup, setPickup] = useState(params.get("pickup") || "");
  const [drop, setDrop] = useState(params.get("drop") || "");
  const [km, setKm] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [ready, setReady] = useState(false);

  const vehicle = params.get("vehicle") || "";
  const pickUpLat = Number(params.get("pickUpLat"));
  const pickUpLong = Number(params.get("pickUpLong"));
  const dropLat = Number(params.get("dropLat"));
  const dropLong = Number(params.get("dropLong"));
  const mobile=Number(params.get("mobile"))
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = VEHICLE_META[vehicle];

  const handleDistance = useCallback((distance: number,duration:number) => {
    setKm(distance);
    setMinutes(duration);
    setReady(true);
  }, []);

  const getNearByVehicles = useCallback(async (lat: number, lng: number, type: string) => {
    if (!lat || !lng) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post("/api/vehicles/near-by", {
        latitude: lat,
        longitude: lng,
        vehicleType: type,
      });
        setVehicles(data);
    } catch {
      setError("Impossible de charger les véhicules. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getNearByVehicles(pickUpLat, pickUpLong, vehicle);
  }, [pickUpLat, pickUpLong, vehicle, getNearByVehicles]);

  return (
    <div className="min-h-screen border-zinc-100 text-zinc-900 overflow-hidden">
      <div className="absolute top-5 left-5 z-50">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => router.back()}
          className="w-11 h-11 rounded-full bg-white shadow-md border border-zinc-200
            flex items-center justify-center hover:bg-zinc-50 transition-colors"
        >
          <ArrowLeft size={17} className="text-zinc-900" />
        </motion.button>
      </div>

      <div className="relative w-full h-[52vh] z-0">
        <SearchMap
          pickup={pickup}
          drop={drop}
          pickupLat={pickUpLat}
          pickupLng={pickUpLong}
          dropLat={dropLat}
          dropLng={dropLong}
          onChange={(p, d) => { setPickup(p); setDrop(d); }}
          onDistance={handleDistance}
        />
        <AnimatePresence>
          {ready && km !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-6 left-4 z-[500] flex items-center gap-2 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="currentColor" className="text-zinc-900">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
              <span className="text-zinc-900 text-xs font-bold">{km.toFixed(1)} km</span>
              <span className="w-px h-3 bg-zinc-200" />
              <span className="text-xs text-zinc-500">~{minutes} min</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
        className="relative z-20 mt-10 bg-white rounded-t-[28px] border-t border-zinc-200 shadow-[0_-8px_40px_rgba(0,0,0,0.08)] pt-5 pb-20 min-h-[52vh]"
      >
        <div className="px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden mb-5"
          >
            <div className="flex gap-3 px-4 py-3 border-b border-zinc-100">
              <div className="flex flex-col items-center pt-1.5 shrink-0">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                <div className="w-px flex-1 bg-zinc-300 my-1 min-h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mb-0.5">Départ</p>
                <p className="text-sm text-zinc-900 font-semibold leading-snug truncate">{pickup || "—"}</p>
              </div>
              <MapPin size={14} className="text-zinc-400 shrink-0 mt-1.5" />
            </div>
            <div className="flex gap-3 px-4 py-3">
              <div className="flex flex-col items-center pt-1.5 shrink-0">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mb-0.5">Arrivée</p>
                <p className="text-sm text-zinc-900 font-semibold leading-snug truncate">{drop || "—"}</p>
              </div>
              <Navigation size={14} className="text-zinc-400 shrink-0 mt-1.5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-4"
          >
            <div>
              <h2 className="text-zinc-900 text-lg font-black tracking-tight">
                {loading
                  ? "Recherche de véhicule"
                  : vehicles.length > 0
                  ? "Disponible"
                  : "Aucun véhicule à proximité"}
              </h2>
              {meta && (
                <div className="text-zinc-400 text-sm mt-0.5">
                  {meta.label} · courses à proximité de votre lieu de prise en charge
                </div>
              )}
            </div>
            <AnimatePresence>
              {loading ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="flex items-center gap-2 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full"
                >
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin" />
                  <span className="text-zinc-500 text-sm font-semibold">Recherche...</span>
                </motion.div>
              ) : vehicles.length > 0 ? (
                <motion.div
                  key="live"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-full"
                >
                  <Zap size={11} className="text-emerald-600 fill-emerald-600" />
                  <span className="text-emerald-700 text-xs font-bold">Live</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4"
              >
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-red-700 text-sm flex-1">{error}</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => getNearByVehicles(pickUpLat, pickUpLong, vehicle)}
                  className="text-red-700 text-xs font-semibold underline underline-offset-2 shrink-0"
                >
                  Réessayer
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!loading && !error && vehicles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-14 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
                  <Search />
                </div>
                <p className="text-zinc-900 font-bold text-base mb-1">Aucun véhicule trouvé</p>
                <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
                  Aucun conducteur {meta?.label || ""} disponible près de votre lieu de prise en charge.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => getNearByVehicles(pickUpLat, pickUpLong, vehicle)}
                  className="mt-5 flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <RefreshCcw size={14} />
                  Réessayer la recherche
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicles.map((v, i) => (
              <motion.div
                key={v._id ?? v.number}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <VehicleCard 
                vehicle={v} 
                distance={km ?? undefined} 
                duration={minutes ?? undefined}
                onBook={() => {
                  const vehicleId = String(v._id ?? "")
                  const driverId  = String(v.owner ?? "")
                  sessionStorage.setItem(
                    "selectedVehicle",
                    JSON.stringify({ vehicleId, driverId })
                  )
                  const url = new URLSearchParams({
                    pickup,
                    drop,
                    vehicle:   v.type,
                    driverId,
                    vehicleId,
                    fare:      String(Math.ceil(
                      (v.baseFare ?? 0) +
                      (v.pricePerKM ?? 0) * km +
                      (v.waitingCharge ?? 0) * minutes
                    )),
                    pickUpLat:  String(pickUpLat),
                    pickUpLong: String(pickUpLong),
                    dropLat:    String(dropLat),
                    dropLong:   String(dropLong),
                    mobile:     String(mobile),
                  })
                  router.push(`/user/checkout?${url.toString()}`)
                }}/>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
