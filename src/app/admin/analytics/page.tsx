"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import {
  TrendingUp, Users, Package, Truck, DollarSign,
  CheckCircle, XCircle, MapPin, Star,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

type Period = 'day' | 'week' | 'month' | 'year';

interface Analytics {
  period: string;
  overview: {
    totalRevenue: number;
    totalCommission: number;
    deliveryRevenue: number;
    grandTotal: number;
    revenueGrowth: string | null;
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    completionRate: string;
    totalDeliveries: number;
    completedDeliveries: number;
    totalClients: number;
    newClients: number;
    totalPartners: number;
    activePartners: number;
    adminWalletBalance: number;
  };
  charts: {
    dailyRevenue: { _id: string; revenue: number; count: number }[];
    cityRevenue: { _id: string; revenue: number; count: number }[];
  };
  topDrivers: { name: string; email: string; earnings: number; rides: number }[];
}

const COLORS = ['#F97316', '#3B82F6', '#16A34A', '#EF4444', '#8B5CF6', '#F59E0B'];
const PERIODS: { label: string; value: Period }[] = [
  { label: "Aujourd'hui", value: 'day' },
  { label: '7 jours', value: 'week' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Cette année', value: 'year' },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/admin/analytics?period=${period}`);
      setData(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const kpis = data ? [
    { label: 'Revenus rides', value: `${data.overview.totalRevenue.toFixed(0)} MAD`, icon: <DollarSign size={20} />, color: 'text-orange-500', growth: data.overview.revenueGrowth },
    { label: 'Commission MaRide', value: `${data.overview.totalCommission.toFixed(0)} MAD`, icon: <TrendingUp size={20} />, color: 'text-green-600' },
    { label: 'Revenus livraisons', value: `${data.overview.deliveryRevenue.toFixed(0)} MAD`, icon: <Package size={20} />, color: 'text-blue-600' },
    { label: 'Total général', value: `${data.overview.grandTotal.toFixed(0)} MAD`, icon: <DollarSign size={20} />, color: 'text-purple-600' },
    { label: 'Courses complétées', value: data.overview.completedBookings, icon: <CheckCircle size={20} />, color: 'text-green-600', sub: `${data.overview.completionRate}% taux` },
    { label: 'Courses annulées', value: data.overview.cancelledBookings, icon: <XCircle size={20} />, color: 'text-red-500' },
    { label: 'Livraisons', value: data.overview.completedDeliveries, icon: <Truck size={20} />, color: 'text-blue-600', sub: `/ ${data.overview.totalDeliveries} total` },
    { label: 'Nouveaux clients', value: data.overview.newClients, icon: <Users size={20} />, color: 'text-orange-500', sub: `${data.overview.totalClients} total` },
    { label: 'Chauffeurs actifs', value: data.overview.activePartners, icon: <Star size={20} />, color: 'text-yellow-500', sub: `/ ${data.overview.totalPartners} total` },
    { label: 'Wallet admin', value: `${data.overview.adminWalletBalance.toFixed(0)} MAD`, icon: <DollarSign size={20} />, color: 'text-gray-700' },
  ] : [];

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
            <TrendingUp size={14} />
            Analytics
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Sélecteur période */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Analytics MaRide</h1>
            <p className="text-gray-500 text-sm">Vue d&apos;ensemble des performances</p>
          </div>
          <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-lg text-xs font-700 transition-all ${
                  period === p.value ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          </div>
        ) : data && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {kpis.map((kpi, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                  <div className={`text-xl font-black ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
                  {kpi.sub && <div className="text-xs text-gray-400">{kpi.sub}</div>}
                  {kpi.growth && (
                    <div className={`text-xs font-700 mt-1 ${Number(kpi.growth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Number(kpi.growth) >= 0 ? '↑' : '↓'} {Math.abs(Number(kpi.growth))}% vs période préc.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Graphique revenus quotidiens */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-800 text-gray-900 mb-6">📈 Revenus quotidiens (30 derniers jours)</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.charts.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toFixed(0)} MAD`]} 
                    labelFormatter={l => `Date : ${l}`}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Revenus par ville */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-800 text-gray-900 mb-6">📍 Revenus par ville</h2>
                {data.charts.cityRevenue.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MapPin className="mx-auto mb-2 opacity-30" size={32} />
                    <p className="text-sm">Aucune donnée</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.charts.cityRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                       <Tooltip formatter={(v) => [`${Number(v).toFixed(0)} MAD`]} />
                        <Bar dataKey="revenue" fill="#F97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {data.charts.cityRevenue.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-gray-600">{c._id ?? 'Non défini'}</span>
                          </div>
                          <span className="font-700 text-gray-900">{c.revenue.toFixed(0)} MAD</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Top chauffeurs */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-800 text-gray-900 mb-6">🏆 Top chauffeurs</h2>
                {data.topDrivers.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Star className="mx-auto mb-2 opacity-30" size={32} />
                    <p className="text-sm">Aucune donnée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.topDrivers.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-900 text-sm">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-700 text-sm text-gray-900 truncate">{d.name}</div>
                          <div className="text-xs text-gray-400">{d.rides} courses</div>
                        </div>
                        <div className="text-right">
                          <div className="font-900 text-orange-500">{d.earnings.toFixed(0)}</div>
                          <div className="text-xs text-gray-400">MAD</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Répartition courses */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-800 text-gray-900 mb-6">🥧 Répartition des courses</h2>
              <div className="flex items-center gap-12">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Complétées', value: data.overview.completedBookings },
                        { name: 'Annulées', value: data.overview.cancelledBookings },
                        { name: 'Autres', value: Math.max(0, data.overview.totalBookings - data.overview.completedBookings - data.overview.cancelledBookings) },
                      ]}
                      cx="50%" cy="50%" outerRadius={80}
                      dataKey="value"
                    >
                      {['#16A34A', '#EF4444', '#9CA3AF'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {[
                    { label: 'Complétées', value: data.overview.completedBookings, color: '#16A34A' },
                    { label: 'Annulées', value: data.overview.cancelledBookings, color: '#EF4444' },
                    { label: 'En cours/autres', value: Math.max(0, data.overview.totalBookings - data.overview.completedBookings - data.overview.cancelledBookings), color: '#9CA3AF' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="font-900 text-gray-900 ml-auto">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-sm font-700 text-gray-900">
                      Taux de complétion : <span className="text-green-600">{data.overview.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}