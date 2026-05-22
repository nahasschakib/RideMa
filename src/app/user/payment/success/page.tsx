"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import axios from "axios";

function SuccessContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const sessionId = params.get("session_id");
  const bookingId = params.get("bookingId");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!bookingId) { setStatus("error"); return; }
    // Pour Stripe : vérification via session_id
    // Pour CMI   : la page est appelée directement après redirection okUrl
    const url = sessionId
      ? `/api/payment/stripe/verify?session_id=${sessionId}&bookingId=${bookingId}`
      : `/api/payment/cmi/verify?bookingId=${bookingId}`;

    axios.get(url)
      .then(() => { setStatus("ok"); setTimeout(() => router.replace(bookingId ? `/user/checkout?bookingId=${bookingId}&payment=success` : "/"), 4000); })
      .catch(() => setStatus("error"));
  }, [sessionId, bookingId, router]);

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-zinc-200 shadow-lg p-12 max-w-sm w-full text-center"
      >
        {status === "loading" && <Loader2 size={40} className="animate-spin text-zinc-900 mx-auto mb-4" />}
        {status === "ok" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-black text-zinc-900 mb-2">Paiement réussi</h2>
            <p className="text-zinc-400 text-sm">Votre réservation est confirmée. Le conducteur va bientôt démarrer.</p>
            <p className="text-zinc-300 text-xs mt-4">Redirection en cours…</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-zinc-900 mb-2">Erreur de vérification</h2>
            <p className="text-zinc-400 text-sm">Impossible de vérifier le paiement. Contactez le support.</p>
            <button onClick={() => router.replace("/")} className="mt-6 text-sm font-bold text-zinc-900 underline">
              Retour à l&apos;accueil
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-100">
      <Loader2 className="animate-spin text-zinc-900" />
    </div>}>
      <SuccessContent />
    </Suspense>
  );
}
