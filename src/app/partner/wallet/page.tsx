"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Wallet } from "lucide-react";

interface ITransaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  reason: string;
  description: string;
  createdAt?: string;
}

interface WalletData {
  balance: number;
  transactions: ITransaction[];
}

const reasonLabel: Record<string, string> = {
  trip_earning: "Gain trajet",
  commission: "Commission",
  manual_deposit: "Dépôt manuel",
  commission_debit: "Débit commission",
};

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<WalletData>("/api/partner/wallet")
      .then(({ data }) => setWallet(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-zinc-950 pt-24 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <h1 className="text-2xl font-bold">Mon Wallet</h1>
          </div>

          {/* Balance card */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
            <p className="text-zinc-400 text-sm mb-1">Solde disponible</p>
            {loading ? (
              <div className="h-10 w-40 bg-zinc-800 rounded-lg animate-pulse" />
            ) : (
              <p className="text-4xl font-bold">
                {(wallet?.balance ?? 0).toFixed(2)}{" "}
                <span className="text-xl text-zinc-400">MAD</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="max-w-lg mx-auto px-4 pb-12">
        <h2 className="text-lg font-semibold mb-4 text-zinc-300">
          Transactions
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-zinc-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : !wallet?.transactions?.length ? (
          <div className="text-center py-16 text-zinc-500">
            Aucune transaction pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {wallet.transactions.slice().reverse().map((tx) => (
              <div
                key={tx._id}
                className="bg-zinc-900 rounded-xl p-4 border border-white/5 flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === "credit"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {tx.type === "credit" ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.description || reasonLabel[tx.reason] || tx.reason}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>

                <span
                  className={`text-sm font-bold shrink-0 ${
                    tx.type === "credit" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {tx.amount.toFixed(2)} MAD
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
