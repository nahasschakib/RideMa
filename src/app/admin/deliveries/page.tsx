"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Package, Truck, CheckCircle2, XCircle, Clock, User } from "lucide-react";

type DeliveryStatus = 'requested' | 'confirmed' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';

interface Delivery {
  _id: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  pickUpAddress: string;
  dropAddress: string;
  description: string;
  weightCategory: string;
  isFragile: boolean;
  zone: string;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  status: DeliveryStatus;
  deliverer?: { name: string; mobileNumber: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; bg: string }> = {
  requested:  { label: 'En attente',     color: '#F59E0B', bg: '#FFFBEB' },
  confirmed:  { label: 'Confirmée',      color: '#3B82F6', bg: '#EFF6FF' },
  picked_up:  { label: 'Récupéré',       color: '#8B5CF6', bg: '#F5F3FF' },
  in_transit: { label: 'En transit',     color: '#F97316', bg: '#FFF7ED' },
  delivered:  { label: 'Livré',          color: '#16A34A', bg: '#F0FDF4' },
  cancelled:  { label: 'Annulé',         color: '#EF4444', bg: '#FEF2F2' },
  failed:     { label: 'Échoué',         color: '#EF4444', bg: '#FEF2F2' },
};

const WEIGHT_LABELS: Record<string, string> = {
  light: '🪶 Léger (0-2kg)',
  medium: '📦 Moyen (2-5kg)',
  heavy: '🏋️ Lourd (5-15kg)',
  extra_heavy: '🚛 Très lourd (15kg+)',
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DeliveryStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data } = await axios.get('/api/admin/deliveries');
      setDeliveries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = deliveries.filter(d => {
    const matchFilter = filter === 'all' || d.status === filter;
    const matchSearch = !search || 
      d.senderName.toLowerCase().includes(search.toLowerCase()) ||
      d.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: deliveries.length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    pending: deliveries.filter(d => ['requested', 'confirmed', 'picked_up', 'in_transit'].includes(d.status)).length,
    cancelled: deliveries.filter(d => d.status === 'cancelled').length,
    revenue: deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + d.totalPrice, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Navbar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b z-40">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo1.png" alt="logo" width={50} height={50} priority />
            <span className="font-bold text-lg">MaRide Admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-black text-white">
            <Package size={14} />
            Livraisons
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: <Package size={20} />, color: 'text-gray-700' },
            { label: 'En cours', value: stats.pending, icon: <Clock size={20} />, color: 'text-orange-500' },
            { label: 'Livrés', value: stats.delivered, icon: <CheckCircle2 size={20} />, color: 'text-green-600' },
            { label: 'Annulés', value: stats.cancelled, icon: <XCircle size={20} />, color: 'text-red-500' },
            { label: 'Revenus', value: `${stats.revenue.toFixed(0)} MAD`, icon: <Truck size={20} />, color: 'text-blue-600' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
              <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres + Recherche */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm flex-1 min-w-[200px] outline-none focus:border-orange-400"
          />
          {(['all', 'requested', 'confirmed', 'in_transit', 'delivered', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-700 transition-all ${
                filter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Toutes' : STATUS_CONFIG[f as DeliveryStatus]?.label ?? f}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-600">Expéditeur</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-600">Destinataire</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-600">Colis</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-600">Zone</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-600">Prix</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-600">Livreur</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-600">Statut</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <Package className="mx-auto mb-3 opacity-30" size={40} />
                      Aucune livraison
                    </td>
                  </tr>
                ) : filtered.map(d => {
                  const status = STATUS_CONFIG[d.status];
                  return (
                    <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-600 text-gray-900">{d.senderName}</div>
                        <div className="text-gray-400 text-xs">{d.senderPhone}</div>
                        <div className="text-gray-400 text-xs truncate max-w-[140px]">{d.pickUpAddress}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-600 text-gray-900">{d.recipientName}</div>
                        <div className="text-gray-400 text-xs">{d.recipientPhone}</div>
                        <div className="text-gray-400 text-xs truncate max-w-[140px]">{d.dropAddress}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-500">{d.description}</div>
                        <div className="text-xs text-gray-400">{WEIGHT_LABELS[d.weightCategory]}</div>
                        {d.isFragile && <span className="text-xs text-amber-600">🥚 Fragile</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{d.zone ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="font-700 text-orange-500">{d.totalPrice} MAD</div>
                        <div className="text-xs text-gray-400">
                          {d.paymentMethod === 'cash' ? '💵 Espèces' : '👛 Wallet'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {d.deliverer
                          ? <div>
                              <div className="font-500">{d.deliverer.name}</div>
                              <div className="text-xs text-gray-400">{d.deliverer.mobileNumber}</div>
                            </div>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-700"
                          style={{ color: status.color, backgroundColor: status.bg }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(d.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}