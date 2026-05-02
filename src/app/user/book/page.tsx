"use client";
import React, { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  BikeIcon,
  BusIcon,
  CarIcon,
  Motorbike,
  ScooterIcon,
  TruckIcon,
  VanIcon,
  CheckCircle,
  Phone,
  LocateFixed,
  MapPin,
  ChevronRight,
  Navigation,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { vehicleType } from "@/models/vehicle.model";
import axios from "axios";

const stepVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const VEHICLES = [
  { id: "car", label: "Voiture", Icon: CarIcon, desc: "Parfait pour les trajets en ville et les déplacements quotidiens." },
  { id: "motocycle", label: "Moto", Icon: Motorbike, desc: "Idéal pour les déplacements rapides en ville." },
  { id: "scooter", label: "Scooter", Icon: ScooterIcon, desc: "Pratique pour les trajets courts et la circulation en ville." },
  { id: "vélo", label: "Vélo", Icon: BikeIcon, desc: "Parfait pour les trajets écologiques et les déplacements en plein air." },
  { id: "truck", label: "Camion", Icon: TruckIcon, desc: "Idéal pour les déménagements et le transport de marchandises." },
  { id: "bus", label: "Bus", Icon: BusIcon, desc: "Parfait pour les trajets en groupe et les déplacements longue distance." },
  { id: "van", label: "Van", Icon: VanIcon, desc: "Idéal pour les familles ou les groupes avec beaucoup de bagages." },
];

type Prediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

function Page() {
  const router = useRouter();

  const [vehicle, setVehicle] = useState<vehicleType>();
  const [mobile, setMobile] = useState("");

  const [pickup, setPickup] = useState("");
  const [pickUpCountry, setPickUpCountry] = useState("");
  const [pickUpLat, setPickUpLat] = useState<number>();
  const [pickUpLong, setPickUpLong] = useState<number>();
  const [loadingPickup, setLoadingPickup] = useState(false);
  const [pickupError, setPickupError] = useState("");

  const [drop, setDrop] = useState("");
  const [dropCountry, setDropCountry] = useState("");
  const [dropLat, setDropLat] = useState<number>();
  const [dropLong, setDropLong] = useState<number>();
  const [loadingDrop, setLoadingDrop] = useState(false);
  const [dropError, setDropError] = useState("");

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [dropPredictions, setDropPredictions] = useState<Prediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const progress = [
    !!vehicle,
    mobile.length === 10,
    !!(pickup && pickUpLat !== undefined),
    !!(drop && dropLat !== undefined),
  ].filter(Boolean).length;

  const canContinue = !!(
    vehicle &&
    mobile.length === 10 &&
    pickup &&
    drop &&
    pickUpLat !== undefined &&
    pickUpLong !== undefined &&
    dropLat !== undefined &&
    dropLong !== undefined
  );

  const searchPlaces = useCallback((query: string, isDropoff: boolean) => {
    const ref = isDropoff ? dropDebounceRef : debounceRef;
    clearTimeout(ref.current);
    if (query.trim().length < 2) {
      isDropoff ? setDropPredictions([]) : setPredictions([]);
      isDropoff ? setShowDropSuggestions(false) : setShowSuggestions(false);
      return;
    }
    ref.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `/api/search?query=${encodeURIComponent(query.trim())}&limit=8&language=fr`
        );
        if (isDropoff) {
          setDropPredictions(data.predictions);
          setShowDropSuggestions(true);
        } else {
          setPredictions(data.predictions);
          setShowSuggestions(true);
        }
      } catch {
        // silent — search errors don't block the user
      }
    }, 350);
  }, []);

  const fetchCoordinates = async (placeId: string, isDropoff: boolean) => {
    if (isDropoff) {
      setLoadingDrop(true);
      setDropError("");
    } else {
      setLoadingPickup(true);
      setPickupError("");
    }
    try {
      const { data } = await axios.get(`/api/place-details?placeId=${placeId}`);
      if (isDropoff) {
        setDropLat(data.lat);
        setDropLong(data.long);
        setDropCountry(data.country || "");
      } else {
        setPickUpLat(data.lat);
        setPickUpLong(data.long);
        setPickUpCountry(data.country || "");
      }
    } catch {
      const msg = "Impossible de localiser cette adresse. Veuillez réessayer.";
      isDropoff ? setDropError(msg) : setPickupError(msg);
    } finally {
      isDropoff ? setLoadingDrop(false) : setLoadingPickup(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setLocating(true);
    setLocationError("");
    setPickupError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await axios.get(
            `/api/geocode?lat=${coords.latitude}&lon=${coords.longitude}`
          );
          const address = [data.street, data.city, data.postcode, data.country]
            .filter(Boolean)
            .join(", ");
          setPickup(address);
          setPickUpCountry(data.country || "");
          setPickUpLat(coords.latitude);
          setPickUpLong(coords.longitude);
          setPredictions([]);
          setShowSuggestions(false);
        } catch {
          setLocationError("Impossible de récupérer votre position. Veuillez réessayer.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Accès à la position refusé. Autorisez la géolocalisation dans vos paramètres.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Position indisponible. Vérifiez votre GPS.");
            break;
          case error.TIMEOUT:
            setLocationError("Délai dépassé. Veuillez réessayer.");
            break;
          default:
            setLocationError("Impossible de récupérer votre position. Veuillez réessayer.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleContinue = () => {
    if (!canContinue) return;
    sessionStorage.setItem(
      "bookingData",
      JSON.stringify({
        vehicle,
        mobile,
        pickup,
        pickUpLat,
        pickUpLong,
        pickUpCountry,
        drop,
        dropLat,
        dropLong,
        dropCountry,
      })
    );
    const params = new URLSearchParams({
      pickup,
      drop,
      vehicle: vehicle!,
      mobile,
      pickUpLat: String(pickUpLat),
      pickUpLong: String(pickUpLong),
      dropLat: String(dropLat),
      dropLong: String(dropLong),
    });
    router.push(`/user/search?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-4 mb-6 px-1">
          <motion.button
            onClick={() => router.push("/")}
            whileTap={{ scale: 0.88 }}
            className="w-11 h-11 p-2 rounded-2xl bg-white border border-zinc-200 shadow-sm
            flex items-center justify-center hover:bg-zinc-50 transition-colors shrink-0"
          >
            <ArrowLeft className="text-zinc-900" size={13} />
          </motion.button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black tracking-tight text-zinc-900">Réservez un trajet</h1>
            <p className="text-xs text-zinc-400 font-normal mt-0.5">
              Veuillez compléter les informations ci-dessous.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {[0, 1, 2, 3].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i < progress ? 20 : 8,
                  background: i < progress ? "#09090b" : "#d4d4d8",
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-visible">
          <div className="h-1 bg-zinc-900 w-[90%] m-auto rounded-full" />
          <div className="p-6 space-y-7">

            {/* Étape 1 — Véhicule */}
            <motion.div
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.05 }}
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-black">1</span>
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Choisir un véhicule
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {VEHICLES.map((v, i) => {
                  const isSelected = vehicle === v.id;
                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ delay: 0.07 + i * 0.05 }}
                      onClick={() => setVehicle(v.id as vehicleType)}
                      className={`relative p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer
                        transition-all duration-200 ${
                          isSelected
                            ? "bg-zinc-900 border-zinc-900/5 shadow-lg"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white" : "bg-zinc-200"
                        }`}
                      >
                        <v.Icon size={18} className={isSelected ? "text-zinc-900" : "text-zinc-600"} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-zinc-900"}`}>
                          {v.label}
                        </p>
                        <p className="text-[10px] truncate text-zinc-400">{v.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5">
                          <CheckCircle size={13} className="text-white fill-white/20" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <div className="h-px bg-zinc-200" />

            {/* Étape 2 — Mobile */}
            <motion.div
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-black">2</span>
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Téléphone mobile
                </p>
              </div>
              <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-zinc-900 focus-within:bg-white transition-all">
                <div className="w-8 h-8 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-zinc-600" />
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="Saisissez votre numéro de téléphone"
                  inputMode="numeric"
                  maxLength={10}
                  className="flex-1 bg-transparent text-sm outline-none text-zinc-900 placeholder:text-zinc-400"
                />
                <AnimatePresence>
                  {mobile.length === 10 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <CheckCircle size={16} className="text-emerald-500 fill-emerald-50 shrink-0" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-[10px] mt-1.5 ml-1 text-zinc-500">
                Les mises à jour seront envoyées à ce numéro
              </p>
            </motion.div>

            <div className="h-px bg-zinc-200" />

            {/* Étape 3 — Itinéraire */}
            <motion.div
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-black">3</span>
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Itinéraire</p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-visible">

                {/* Point de départ */}
                <div className="relative z-30">
                  <div className="flex items-center gap-3 px-4 py-3.5 focus-within:bg-white rounded-t-2xl transition-colors">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white shadow" />
                      <div className="w-px h-5 bg-zinc-300 mt-1" />
                    </div>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPickup(val);
                        setPickUpLat(undefined);
                        setPickUpLong(undefined);
                        setPickupError("");
                        searchPlaces(val, false);
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
                      placeholder="Saisissez votre point de départ"
                      className="flex-1 bg-transparent text-sm outline-none text-zinc-900 placeholder:text-zinc-400"
                    />
                    {loadingPickup ? (
                      <Loader2 size={14} className="text-zinc-400 shrink-0 animate-spin" />
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={useCurrentLocation}
                        disabled={locating}
                        className="w-8 h-8 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0 hover:bg-zinc-300 transition-colors"
                      >
                        <LocateFixed
                          size={14}
                          className={`text-zinc-700 ${locating ? "animate-spin" : ""}`}
                        />
                      </motion.button>
                    )}
                  </div>

                  {(locationError || pickupError) && (
                    <div className="flex items-center gap-2 px-4 pb-2 text-red-500">
                      <AlertCircle size={12} className="shrink-0" />
                      <span className="text-[11px]">{locationError || pickupError}</span>
                    </div>
                  )}

                  <AnimatePresence>
                    {showSuggestions && predictions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-zinc-200 rounded-2xl max-h-52 shadow-xl overflow-y-auto"
                      >
                        {predictions.map((p, i) => (
                          <motion.div
                            key={p.placeId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => {
                              setPickup(p.description);
                              setPredictions([]);
                              setShowSuggestions(false);
                              fetchCoordinates(p.placeId, false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 cursor-pointer"
                          >
                            <MapPin size={13} className="text-zinc-400 shrink-0" />
                            <span className="text-sm text-zinc-900 font-medium truncate">{p.description}</span>
                            <ChevronRight size={13} className="text-zinc-400 ml-auto shrink-0" />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-zinc-200" />

                {/* Destination */}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 px-4 py-3.5 focus-within:bg-white rounded-b-2xl transition-colors">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-3 h-3 rounded-full border-2 border-zinc-900 bg-white shadow" />
                    </div>
                    <input
                      type="text"
                      value={drop}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDrop(val);
                        setDropLat(undefined);
                        setDropLong(undefined);
                        setDropError("");
                        searchPlaces(val, true);
                      }}
                      disabled={!pickup}
                      onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
                      onFocus={() => dropPredictions.length > 0 && setShowDropSuggestions(true)}
                      placeholder={
                        pickup
                          ? "Saisissez votre destination"
                          : "Sélectionnez d'abord un point de départ"
                      }
                      className="flex-1 bg-transparent text-sm outline-none text-zinc-900 placeholder:text-zinc-400 disabled:cursor-not-allowed"
                    />
                    {loadingDrop ? (
                      <Loader2 size={14} className="text-zinc-400 shrink-0 animate-spin" />
                    ) : (
                      <Navigation size={14} className="text-zinc-300 shrink-0" />
                    )}
                  </div>

                  {dropError && (
                    <div className="flex items-center gap-2 px-4 pb-2 text-red-500">
                      <AlertCircle size={12} className="shrink-0" />
                      <span className="text-[11px]">{dropError}</span>
                    </div>
                  )}

                  <AnimatePresence>
                    {showDropSuggestions && dropPredictions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-zinc-200 rounded-2xl max-h-52 shadow-xl overflow-y-auto"
                      >
                        {dropPredictions.map((p, i) => (
                          <motion.div
                            key={p.placeId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => {
                              setDrop(p.description);
                              setDropPredictions([]);
                              setShowDropSuggestions(false);
                              fetchCoordinates(p.placeId, true);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 cursor-pointer"
                          >
                            <Navigation size={13} className="text-zinc-400 shrink-0" />
                            <span className="text-sm text-zinc-900 font-medium truncate">{p.description}</span>
                            <ChevronRight size={13} className="text-zinc-400 ml-auto shrink-0" />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Bouton Continuer */}
            <motion.div variants={stepVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
              <motion.button
                onClick={handleContinue}
                whileTap={{ scale: 0.97 }}
                whileHover={canContinue ? { scale: 1.02 } : {}}
                disabled={!canContinue}
                className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-black text-white font-black text-sm
                transition-colors tracking-wide flex items-center justify-center gap-2.5
                disabled:opacity-35 shadow-lg disabled:shadow-none disabled:cursor-not-allowed"
              >
                <span>Continuer</span>
                <ChevronRight size={16} />
              </motion.button>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Page;
