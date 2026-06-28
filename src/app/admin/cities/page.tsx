"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { MapPin, Plus, ToggleLeft, ToggleRight } from "lucide-react";

interface City {
  _id: string;
  name: string;
  nameAr: string;
  isActive: boolean;
  coordinates: { lat: number; lng: number };
  radiusKm: number;
  pricing: {
    baseFare: number;
    pricePerKM: number;
    waitingCharge: number;
    minimumFare: number;
  };
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<City | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    baseFare: '', pricePerKM: '', waitingCharge: '', minimumFare: '', radiusKm: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCities(); }, []);

  const fetchCities = async () => {
    try {
      const { data } = await axios.get('/api/admin/cities');
      setCities(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSelect = (city: City) => {
    setSelected(city);
    setForm({
      baseFare: String(city.pricing.baseFare),
      pricePerKM: String(city.pricing.pricePerKM),
      waitingCharge: String(city.pricing.waitingCharge),
      minimumFare: String(city.pricing.minimumFare),
      radiusKm: String(city.radiusKm),
    });
    setEditing(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await axios.patch(`/api/admin/cities/${selected._id}`, {
        radiusKm: Number(form.radiusKm),
        pricing: {
          baseFare: Number(form.baseFare),
          pricePerKM: Number(form.pricePerKM),
          waitingCharge: Number(form.waitingCharge),
          minimumFare: Number(form.minimumFare),
        },
      });
      fetchCities();
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleToggle = async (city: City) => {
    await axios.patch(`/api/admin/cities/${city._id}`, { isActive: !city.isActive });
    fetchCities();
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
            <MapPin size={14} />
            Villes & Tarifs
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Gestion des villes</h1>
          <p className="text-gray-500 text-sm">{cities.filter(c => c.isActive).length} ville(s) active(s) sur {cities.length}</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Liste villes */}
          <div className="col-span-1 space-y-3">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            ) : cities.map(city => (
              <button
                key={city._id}
                onClick={() => handleSelect(city)}
                className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition-all ${selected?._id === city._id ? 'border-orange-400' : 'border-gray-100 hover:border-gray-200'} ${!city.isActive && 'opacity-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-800 text-gray-900">{city.name}</span>
                    <span className="text-gray-400 text-xs mr-2"> — {city.nameAr}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleToggle(city); }}>
                    {city.isActive
                      ? <ToggleRight size={22} className="text-green-500" />
                      : <ToggleLeft size={22} className="text-gray-300" />
                    }
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  Rayon : {city.radiusKm} km • Base : {city.pricing.baseFare} MAD • /km : {city.pricing.pricePerKM} MAD
                </div>
              </button>
            ))}
          </div>

          {/* Détail ville */}
          <div className="col-span-2">
            {!selected ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <MapPin className="mx-auto mb-3 opacity-30" size={40} />
                  <p>Sélectionnez une ville</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-900 p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-900 text-xl">{selected.name}</h2>
                    <p className="text-gray-400 text-sm">{selected.nameAr} • {selected.coordinates.lat.toFixed(4)}, {selected.coordinates.lng.toFixed(4)}</p>
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-700 hover:bg-orange-600"
                  >
                    {editing ? 'Annuler' : '✏️ Modifier'}
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Tarif de base (MAD)', key: 'baseFare' },
                      { label: 'Prix par km (MAD)', key: 'pricePerKM' },
                      { label: 'Attente par min (MAD)', key: 'waitingCharge' },
                      { label: 'Tarif minimum (MAD)', key: 'minimumFare' },
                      { label: 'Rayon de couverture (km)', key: 'radiusKm' },
                    ].map(f => (
                      <div key={f.key} className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs text-gray-400 mb-2">{f.label}</div>
                        {editing ? (
                          <input
                            type="number"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-700 outline-none focus:border-orange-400"
                            value={form[f.key as keyof typeof form]}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          />
                        ) : (
                          <div className="text-lg font-900 text-gray-900">
                            {f.key === 'radiusKm' ? selected.radiusKm : selected.pricing[f.key as keyof typeof selected.pricing]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Simulation tarif */}
                  <div className="mt-6 bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <div className="text-sm font-700 text-orange-600 mb-2">📊 Simulation — course de 5km</div>
                    <div className="text-2xl font-black text-orange-500">
                      {Math.max(
                        Number(form.minimumFare || selected.pricing.minimumFare),
                        Number(form.baseFare || selected.pricing.baseFare) + Number(form.pricePerKM || selected.pricing.pricePerKM) * 5
                      ).toFixed(0)} MAD
                    </div>
                  </div>

                  {editing && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="mt-4 w-full bg-orange-500 text-white py-3 rounded-xl font-700 hover:bg-orange-600 disabled:opacity-50"
                    >
                      {saving ? 'Enregistrement...' : '✅ Enregistrer les tarifs'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}