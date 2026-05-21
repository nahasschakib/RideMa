"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { motion } from "motion/react";

function CancelContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const bookingId = params.get("bookingId");

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-zinc-200 shadow-lg p-12 max-w-sm w-full text-center"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center mx-auto mb-5">
          <XCircle size={36} className="text-zinc-500" />
        </motion.div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Paiement annulé</h2>
        <p className="text-zinc-400 text-sm mb-6">Votre paiement n&apos;a pas été effectué. La réservation reste en attente.</p>
        <button
          onClick={() => router.replace(bookingId ? `/user/checkout?bookingId=${bookingId}` : "/")}
          className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-black text-sm rounded-2xl transition-colors"
        >
          Réessayer
        </button>
      </motion.div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-100" />}>
      <CancelContent />
    </Suspense>
  );
}
