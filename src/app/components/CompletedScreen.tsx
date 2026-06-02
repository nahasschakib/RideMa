"use client";
import { PaymentStatus } from "@/models/booking.model";
import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const PAYMENT_LABELS: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Payé en ligne", cls: "bg-emerald-100 text-emerald-700" },
  cash: { label: "Espèces", cls: "bg-zinc-100 text-zinc-700" },
  failed: { label: "Échoué", cls: "bg-red-100 text-red-700" },
};
interface CompletedBooking {
  fare: number;
  paymentStatus: PaymentStatus;
  user?: { name?: string; email?: string } | string;
}

function CompletedScreen({
  booking,
  role,
}: {
  booking: CompletedBooking;
  role: string;
}) {
    const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-screen w-full flex flex-col overflow-y-auto bg-zinc-950"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="w-32 h-32 rounded-full bg-emerald-400/10 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-emerald-400/20 flex items-center justify-center">
              <CheckCircle2 size={52} className="text-emerald-400" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-sm"
        >
          <p className="text-zinc-400 text-xs uppercase tracking-[0.25em] font-semibold text-center mb-2">
            Voyage terminé
          </p>
          <h1 className="text-3xl text-white font-black text-center mb-1">
            Course terminée !
          </h1>
          <p className="text-zinc-400 text-center">
            {role === "driver"
              ? "Client déposé à destination avec succès en toute sécurité."
              : "Merci d'avoir choisi notre service de transport."}
          </p>
          <div className="bg-zinc-900 rounded-2xl p-5 mb-3 border border-zinc-800">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-semibold text-center mb-1">
              Tarif perçu
            </p>
            <p className="text-white text-2xl text-center font-black items-center justify-center gap-1 mb-4">
              {booking.fare.toLocaleString("fr-FR", {
                style: "currency",
                currency: "MAD",
              })}
            </p>
            <div className="flex items-center justify-between text-xs border-t border-zinc-800 pt-3 ">
              <span className="text-zinc-500">Mode de paiement</span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  PAYMENT_LABELS[booking.paymentStatus]?.cls ??
                  "bg-zinc-700 text-zinc-300"
                }`}
              >
                {PAYMENT_LABELS[booking.paymentStatus]?.label ??
                  booking.paymentStatus}
              </span>
            </div>
          </div>
{booking.user && typeof booking.user === "object" && "name" in booking.user && (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
        <UserIcon size={20} className="text-zinc-400" />
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
           Passager
        </p>
        <p className="text-white text-sm font-bold">{(booking.user as unknown as { name: string })?.name ?? "user"}</p>
        <p className="text-zinc-400 text-sm">
          {(booking.user as unknown as { email: string })?.email ?? "email"}
        </p>
      </div>
    </div>
)}

<button 
  onClick={() => router.push("/")}
  className="w-full border border-zinc-700 text-zinc-400 rounded-2xl py-3 text-sm font-semibold hover:bg-zinc-900 transition-colors"
>
    Retour à l&apos;accueil
</button>

        </motion.div>
      </div>
    </motion.div>
  );
}

export default CompletedScreen;
