"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, User } from "lucide-react";

interface PromoCode {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount: number;
  target: 'ride' | 'delivery' | 'both';
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

const TARGET_LABELS = {
  ride: '🚗 Course',
  delivery: '📦 Livraison',
  both: '🚗📦 Les deux',
};

export default function PromoPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percentage',
    discountValue: '', maxDiscount: '', minOrderAmount: '',
    target: 'both', maxUses: '', expiresAt: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    try {
      const { data } = await axios.get('/api/admin/promo');
      setPromos(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await axios.post('/api/admin/promo', {
        ...form,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxUses: Number(form.maxUses),
      });
      setShowForm(false);
      setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', maxDiscount: '', minOrderAmount: '', target: 'both', maxUses: '', expiresAt: '' });
      fetchPromos();
    }  catch (e) {
        const err = e as { response?: { data?: { error?: string } } };
        alert(err.response?.data?.error ?? 'Erreur');
    } finally { setCreating(false); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await axios.patch(`/api/admin/promo/${id}`, { isActive: !isActive });
    fetchPromos();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Supprimer le code "${code}" ?`)) return;
    await axios.delete(`/api/admin/promo/${id}`);
    fetchPromos();
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
            <Tag size={14} />
            Codes Promo
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Header + bouton créer */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Codes promotionnels</h1>
            <p className="text-gray-500 text-sm">{promos.length} code(s) au total</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-700 hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            Créer un code
          </button>
        </div>

        {/* Formulaire création */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-800 text-gray-900 mb-6">Nouveau code promo</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-700 text-gray-500 mb-1 block">Code *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-700 uppercase outline-none focus:border-orange-400"
                  value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="MARIDE20" required
                />
              </div>
              <div>
                <label className="text-xs font-700 text-gray-500 mb-1 block">Description *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="20% de réduction" required
                />
              </div>
              <div>
                <label className="text-xs font-700 text-gray-500 mb-1 block">Type de réduction *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                >
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (MAD)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-700 text-gray-500 mb-1 block">
                  Valeur * {form.discountType === 'percentage' ? '(%)' : '(MAD)'}
                </label>
                <input
                  type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'percentage' ? '20' : '10'} required
                />
              </div>
              {form.discountType === 'percentage' && (
                <div>
                  <label className="text-xs font-700 text-gray-500 mb-1 block">Réduction max (MAD)</label>
                  <input
                    type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                    value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                    placeholder="50"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-700 text-gray-500 mb-1 block">Montant minimum (MAD)</label>
                <input
                  type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                  placeholder="20"
                />
              </div>
              <div>
                <label className="text-xs font-700 text-gray-500 mb-1 block">Applicable sur *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                >
                  <option value="both">🚗📦 Les deux</option>
                  <option value="ride">🚗 Course uniquement</option>
                  <option value="delivery">📦 Livraison uniquement</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-700 text-gray-500 mb-1 block">Utilisations max *</label>
                <input
                  type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                  placeholder="100" required
                />
              </div>
              <div>
                <label className="text-xs font-700 text-gray-500 mb-1 block">Date d&apos;expiration</label>
                <input
                  type="date" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                />
              </div>
              <div className="col-span-2 flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-700 hover:bg-orange-600 disabled:opacity-50">
                  {creating ? 'Création...' : '✅ Créer le code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste codes */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.length === 0 ? (
              <div className="col-span-3 text-center py-20 text-gray-400">
                <Tag className="mx-auto mb-3 opacity-30" size={40} />
                <p>Aucun code promo</p>
              </div>
            ) : promos.map(p => (
              <div key={p._id} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${!p.isActive && 'opacity-60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-black text-white px-3 py-1 rounded-lg text-sm font-900 tracking-wider">{p.code}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(p._id, p.isActive)} className="text-gray-400 hover:text-orange-500 transition-colors">
                      {p.isActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                    </button>
                    <button onClick={() => handleDelete(p._id, p.code)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-lg text-xs font-700">
                    {p.discountType === 'percentage' ? `${p.discountValue}%` : `-${p.discountValue} MAD`}
                  </span>
                  <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-lg text-xs font-700">
                    {TARGET_LABELS[p.target]}
                  </span>
                  {p.minOrderAmount > 0 && (
                    <span className="bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-lg text-xs">
                      Min {p.minOrderAmount} MAD
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Utilisations</span>
                    <span>{p.usedCount}/{p.maxUses}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{ width: `${Math.min((p.usedCount / p.maxUses) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {p.expiresAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Expire le {new Date(p.expiresAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}