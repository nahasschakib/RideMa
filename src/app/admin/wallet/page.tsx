"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, Clock, User, Phone, Mail } from "lucide-react";

interface Driver {
  _id: string;
  name: string;
  email: string;
  mobileNumber: string;
}

interface DepositRequest {
  _id: string;
  driver: Driver;
  depositCode: string;
  amount: number;
  receiptDescription: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function AdminWalletPage() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
    axios.get<DepositRequest[]>("/api/admin/wallet/pending-deposits")
      .then(({ data }) => setDeposits(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleValidate = async (deposit: DepositRequest) => {
    setValidating(deposit._id);
    try {
      await axios.post("/api/admin/wallet/validate-deposit", {
        driverId: deposit.driver._id,
        depositCode: deposit.depositCode,
        amount: deposit.amount,
      });
      setDeposits((prev) => prev.filter((d) => d._id !== deposit._id));
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dépôts en attente</h1>
        <p className="text-sm text-gray-500 mb-8">Validez les demandes de dépôt de garantie des conducteurs</p>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse h-32" />
            ))}
          </div>
        )}

        {!loading && deposits.length === 0 && (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucun dépôt en attente</p>
          </div>
        )}

        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div key={deposit._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-yellow-500" />
                    <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded-full">En attente</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(deposit.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-800">{deposit.amount} MAD</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={14} className="text-gray-400" />
                  <span>{deposit.driver.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span>{deposit.driver.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{deposit.driver.mobileNumber || "—"}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-400 mb-1">Référence virement</p>
                <p className="text-sm font-mono font-medium text-gray-700">{deposit.depositCode}</p>
                {deposit.receiptDescription && (
                  <>
                    <p className="text-xs text-gray-400 mt-2 mb-1">Description</p>
                    <p className="text-sm text-gray-600">{deposit.receiptDescription}</p>
                  </>
                )}
              </div>

              <button
                onClick={() => handleValidate(deposit)}
                disabled={validating === deposit._id}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                {validating === deposit._id ? "Validation..." : "Valider le dépôt"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
