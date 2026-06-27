"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, MapPin } from "lucide-react";

interface SOSAlert {
  _id: string;
  userId: string;
  userName: string;
  userPhone: string;
  role: string;
  latitude: number;
  longitude: number;
  bookingId?: string;
  createdAt: string;
}

export default function SOSPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/sos')
      .then(r => r.json())
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b z-40">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo1.png" alt="logo" width={50} height={50} priority />
            <span className="font-bold text-lg">MaRide Admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-red-500 text-white">
            <AlertTriangle size={14} />
            Alertes SOS
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Alertes SOS</h1>
          <p className="text-gray-500 text-sm">{alerts.length} alerte(s) enregistrée(s)</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <AlertTriangle className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-400">Aucune alerte SOS</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(a => (
              <div key={a._id} className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="text-red-500" size={20} />
                    </div>
                    <div>
                      <div className="font-800 text-gray-900">{a.userName}</div>
                      <div className="text-sm text-gray-500">
                        {a.role === 'partner' ? '🏍️ Chauffeur' : '👤 Client'} — {a.userPhone}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    {a.bookingId && (
                      <div className="text-xs text-gray-400 mt-1">Booking #{a.bookingId.slice(-6)}</div>
                    )}
                  </div>
                </div>
                
                  <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <MapPin size={14} />
                  Voir sur Google Maps ({a.latitude.toFixed(4)}, {a.longitude.toFixed(4)})
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}