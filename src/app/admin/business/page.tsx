"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Building2, Users, Wallet, CheckCircle, XCircle, Clock } from "lucide-react";

interface Company {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ice: string;
  plan: string;
  status: 'pending' | 'active' | 'suspended';
  wallet: { balance: number };
  employeeCount: number;
  currentMonthSpend: number;
  monthlyLimit?: number;
  adminUser: { name: string; email: string; mobileNumber?: string };
  createdAt: string;
}

const STATUS_CONFIG = {
  pending:   { label: 'En attente', color: '#F59E0B', bg: '#FFFBEB', icon: <Clock size={14} /> },
  active:    { label: 'Actif',      color: '#16A34A', bg: '#F0FDF4', icon: <CheckCircle size={14} /> },
  suspended: { label: 'Suspendu',   color: '#EF4444', bg: '#FEF2F2', icon: <XCircle size={14} /> },
};

export default function BusinessPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Company | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data } = await axios.get('/api/admin/business');
      setCompanies(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      setUpdating(true);
      await axios.patch(`/api/admin/business/${id}`, { status });
      fetchCompanies();
      if (selected?._id === id) {
        setSelected(prev => prev ? { ...prev, status: status as 'pending' | 'active' | 'suspended' } : null);
      }
    } catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    pending: companies.filter(c => c.status === 'pending').length,
    totalBalance: companies.reduce((s, c) => s + (c.wallet?.balance ?? 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b z-40">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo1.png" alt="logo" width={50} height={50} priority />
            <span className="font-bold text-lg">MaRide Admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-black text-white">
            <Building2 size={14} />
            MaRide Business
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Entreprises', value: stats.total, icon: <Building2 size={20} />, color: 'text-gray-700' },
            { label: 'Actives', value: stats.active, icon: <CheckCircle size={20} />, color: 'text-green-600' },
            { label: 'En attente', value: stats.pending, icon: <Clock size={20} />, color: 'text-orange-500' },
            { label: 'Wallets total', value: `${stats.totalBalance.toFixed(0)} MAD`, icon: <Wallet size={20} />, color: 'text-blue-600' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
              <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Liste entreprises */}
          <div className="col-span-1 space-y-3">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            ) : companies.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
                <Building2 className="mx-auto mb-2 opacity-30" size={32} />
                <p className="text-sm">Aucune entreprise</p>
              </div>
            ) : companies.map(c => {
              const cfg = STATUS_CONFIG[c.status];
              return (
                <button
                  key={c._id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition-all ${selected?._id === c._id ? 'border-orange-400' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-800 text-gray-900 text-sm">{c.name}</span>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{c.email}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400"><Users size={10} className="inline mr-1" />{c.employeeCount} employés</span>
                    <span className="text-xs font-700 text-orange-500">{c.wallet?.balance?.toFixed(0) ?? 0} MAD</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Détail entreprise */}
          <div className="col-span-2">
            {!selected ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <Building2 className="mx-auto mb-3 opacity-30" size={40} />
                  <p>Sélectionnez une entreprise</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-white font-900 text-xl">{selected.name}</h2>
                      <p className="text-gray-400 text-sm">{selected.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-white">{selected.wallet?.balance?.toFixed(0) ?? 0}</div>
                      <div className="text-orange-400 text-sm font-700">MAD wallet</div>
                    </div>
                  </div>
                  {/* Actions statut */}
                  <div className="flex gap-2">
                    {(['pending', 'active', 'suspended'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selected._id, s)}
                        disabled={updating || selected.status === s}
                        className={`px-4 py-2 rounded-xl text-xs font-700 transition-all disabled:opacity-40 ${
                          selected.status === s
                            ? 'bg-white text-gray-900'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {s === 'pending' ? '⏳ En attente' : s === 'active' ? '✅ Activer' : '🚫 Suspendre'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Infos */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Responsable', value: selected.adminUser?.name },
                      { label: 'Téléphone admin', value: selected.adminUser?.mobileNumber ?? '—' },
                      { label: 'Téléphone', value: selected.phone },
                      { label: 'ICE', value: selected.ice },
                      { label: 'Adresse', value: selected.address },
                      { label: 'Plan', value: selected.plan },
                      { label: 'Employés', value: String(selected.employeeCount) },
                      { label: 'Dépenses mois', value: `${selected.currentMonthSpend} MAD` },
                      { label: 'Plafond mensuel', value: selected.monthlyLimit ? `${selected.monthlyLimit} MAD` : 'Illimité' },
                      { label: 'Inscrit le', value: new Date(selected.createdAt).toLocaleDateString('fr-FR') },
                    ].map((r, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <div className="text-xs text-gray-400 mb-1">{r.label}</div>
                        <div className="text-sm font-700 text-gray-900">{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}