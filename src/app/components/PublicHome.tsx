"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Bike, Car, Truck, Van, Star, Clock, Users, ThumbsUp, Zap, Calendar, MapPin } from "lucide-react";
import AuthModal from "./AuthModal";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const GOLD = "#e8c44a";

const vehicles = [
  { icon: Bike,  label: "Vélo / Moto",   price: "dès 15 MAD" },
  { icon: Car,   label: "Voiture",        price: "dès 30 MAD" },
  { icon: Car,   label: "SUV",            price: "dès 50 MAD" },
  { icon: Truck, label: "Van / Fourgon",  price: "dès 60 MAD" },
  { icon: Truck, label: "Camion",         price: "sur devis"  },
];

const stats = [
  { value: "500+",   label: "Chauffeurs actifs" },
  { value: "12 000+", label: "Trajets effectués" },
  { value: "4.8/5",  label: "Note moyenne" },
  { value: "24/7",   label: "Disponibilité" },
];

const steps = [
  { n: "01", title: "Choisissez votre véhicule",  desc: "Sélectionnez le type de véhicule adapté à votre besoin." },
  { n: "02", title: "Confirmez votre trajet",      desc: "Indiquez votre point de départ et votre destination." },
  { n: "03", title: "Suivez en temps réel",        desc: "Tracez votre chauffeur sur la carte jusqu'à l'arrivée." },
];

const partnerFeatures = [
  { icon: Zap,      title: "Paiement rapide",  desc: "Recevez vos gains directement dans votre wallet." },
  { icon: Calendar, title: "Horaires libres",  desc: "Travaillez quand vous voulez, sans contrainte." },
  { icon: Clock,    title: "Support 24/7",     desc: "Une équipe disponible à tout moment pour vous aider." },
];

export default function PublicHome() {
  const [authOpen, setAuthOpen] = useState(false);
  const { userData } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  const handleReserve = () => {
    if (!userData) {
      setAuthOpen(true);
    } else {
      router.push("/user/book");
    }
  };

  return (
    <>
      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen w-full flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden"
        style={{ background: "#0a0a0a" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/driver-dressed-elegant-costume.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium border"
            style={{ borderColor: GOLD, color: GOLD, backgroundColor: "rgba(232,196,74,0.1)" }}
          >
            <Star size={13} fill={GOLD} />
            Disponible à Casablanca, Rabat, Marrakech
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight"
          >
            Votre trajet,{" "}
            <span style={{ color: GOLD }}>notre priorité</span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-5 text-gray-300 text-lg max-w-xl mx-auto"
          >
            Réservez un chauffeur en quelques secondes, à tout moment, partout au Maroc.
          </motion.p>

          {/* Boutons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap gap-4 justify-center"
          >
            <button
              onClick={handleReserve}
              className="px-8 py-3.5 rounded-full font-bold text-black shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: GOLD }}
            >
              Réserver maintenant
            </button>
            <button
              onClick={() => router.push("/partner/onboarding/vehicle")}
              className="px-8 py-3.5 rounded-full font-semibold text-white border border-white/40 hover:border-white transition-transform hover:scale-105 active:scale-95"
            >
              Devenir partenaire
            </button>
          </motion.div>

          {/* Pills véhicules */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-10 flex flex-wrap gap-3 justify-center"
          >
            {["Vélo / Moto", "Voiture", "Van / Fourgon", "Camion"].map((v) => (
              <span
                key={v}
                className="px-4 py-1.5 rounded-full text-sm font-medium border border-white/20 text-white/80 bg-white/5"
              >
                {v}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 2. STATS ────────────────────────────────────────────── */}
      <section style={{ background: "#111" }} className="py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-black" style={{ color: GOLD }}>{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. COMMENT ÇA MARCHE ────────────────────────────────── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center text-zinc-900 mb-2">Comment ça marche</h2>
          <p className="text-center text-zinc-500 mb-14">Simple, rapide, fiable.</p>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center">
                <span className="text-5xl font-black mb-4" style={{ color: GOLD }}>{n}</span>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{title}</h3>
                <p className="text-zinc-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. NOTRE FLOTTE ─────────────────────────────────────── */}
      <section style={{ background: "#0a0a0a" }} className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-white mb-2">Notre flotte</h2>
          <p className="text-center text-gray-500 mb-14">Un véhicule pour chaque besoin.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {vehicles.map(({ icon: Icon, label, price }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center rounded-2xl p-6 border border-white/8 bg-white/4 hover:border-yellow-400/40 transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(232,196,74,0.12)" }}
                >
                  <Icon size={22} style={{ color: GOLD }} />
                </div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-500 text-xs mt-1">{price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. SECTION PARTENAIRE ───────────────────────────────── */}
      <section style={{ background: "#111" }} className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Conduisez.{" "}
            <span style={{ color: GOLD }}>Gagnez.</span>{" "}
            Librement.
          </h2>
          <p className="text-gray-400 mb-12 max-w-xl mx-auto">
            Rejoignez notre réseau de chauffeurs partenaires et prenez le contrôle de votre activité.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {partnerFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(232,196,74,0.12)" }}
                >
                  <Icon size={22} style={{ color: GOLD }} />
                </div>
                <h3 className="text-white font-bold mb-1">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/partner/onboarding/vehicle")}
            className="px-10 py-4 rounded-full font-bold text-black transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: GOLD }}
          >
            Commencer maintenant
          </button>
        </div>
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
