"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Wallet, TrendingUp, Users, User } from "lucide-react";

interface WalletData {
  _id: string;
  owner: { name: string; email: string; mobileNumber?: string };
  balance: number;
  ownerType: string;
  isActive: boolean;
  transactions: { type: string; amount: number; reason: string; description: string; createdAt: string }[];
  createdAt: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WalletData | null>(null);

  useEffect(() => {
    axios.get('/api/admin/wallets')
      .then(r => setWallets(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const totalTx = wallets.reduce((s, w) => s + w.transactions.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b z-40">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo1.png" alt="logo" width={50} height={50} priority />
            <span className="font-bold text-lg">MaRide Admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-black text-white">
            <Wallet size={14} />
            Wallets Clients
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Users className="text-orange-500 mb-2" size={20} />
            <div className="text-2xl font-black text-gray-900">{wallets.length}</div>
            <div className="text-xs text-gray-500">Wallets actifs</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Wallet className="text-green-500 mb-2" size={20} />
            <div className="text-2xl font-black text-green-600">{totalBalance.toFixed(2)} MAD</div>
            <div className="text-xs text-gray-500">Solde total</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <TrendingUp className="text-blue-500 mb-2" size={20} />
            <div className="text-2xl font-black text-blue-600">{totalTx}</div>
            <div className="text-xs text-gray-500">Transactions totales</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Liste wallets */}
          <div className="col-span-1 space-y-3">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            ) : wallets.map(w => (
              <button
                key={w._id}
                onClick={() => setSelected(w)}
                className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition-all ${selected?._id === w._id ? 'border-orange-400' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-700 text-sm">
                      {w.owner?.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-700 text-sm text-gray-900 truncate">{w.owner?.name ?? '—'}</div>
                    <div className="text-xs text-gray-400 truncate">{w.owner?.email ?? '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-900 text-orange-500">{w.balance.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">MAD</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Détail wallet */}
          <div className="col-span-2">
            {selected ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-900 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white font-900 text-lg">{selected.owner?.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-white font-800">{selected.owner?.name}</div>
                      <div className="text-gray-400 text-sm">{selected.owner?.email}</div>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white">{selected.balance.toFixed(2)}</div>
                  <div className="text-orange-400 font-700">MAD</div>
                </div>

                <div className="p-6">
                  <h3 className="font-800 text-gray-900 mb-4">Transactions ({selected.transactions.length})</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selected.transactions.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">Aucune transaction</p>
                    ) : selected.transactions.map((tx, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.type === 'credit' ? '↑' : '↓'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-600 text-gray-900 truncate">{tx.description}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className={`font-800 ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{tx.amount.toFixed(2)} MAD
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <Wallet className="mx-auto mb-3 opacity-30" size={40} />
                  <p>Sélectionnez un wallet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}