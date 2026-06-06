"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, User, Phone, Mail, CheckCircle, XCircle } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  mobileNumber: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios.get<ProfileData>("/api/user/profile")
      .then(({ data }) => {
        setProfile(data);
        setName(data.name);
        setMobileNumber(data.mobileNumber ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await axios.patch<ProfileData>("/api/user/profile", { name, mobileNumber });
      setProfile(data);
      setEditMode(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="bg-zinc-950 pt-24 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.back()} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">Mon Profil</h1>
          </div>

          {/* Avatar placeholder */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold mb-3">
              {profile?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <p className="text-zinc-400 text-sm">
              Membre depuis {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "—"}
            </p>
          </div>

          {/* Champs */}
          <div className="space-y-4">
            {/* Nom */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <User size={15} className="text-zinc-400" />
                <p className="text-xs text-zinc-400">Nom complet</p>
              </div>
              {editMode ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <p className="font-medium">{profile?.name}</p>
              )}
            </div>

            {/* Téléphone */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Phone size={15} className="text-zinc-400" />
                <p className="text-xs text-zinc-400">Téléphone</p>
              </div>
              {editMode ? (
                <input
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <p className="font-medium">{profile?.mobileNumber || <span className="text-zinc-500 text-sm">Non renseigné</span>}</p>
              )}
            </div>

            {/* Email */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={15} className="text-zinc-400" />
                <p className="text-xs text-zinc-400">Email</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium">{profile?.email}</p>
                {profile?.isEmailVerified
                  ? <CheckCircle size={16} className="text-green-400" />
                  : <XCircle size={16} className="text-red-400" />
                }
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {success && (
              <p className="text-center text-green-400 text-sm">Profil mis à jour ✓</p>
            )}
            {editMode ? (
              <div className="flex gap-3">
                <button
                  onClick={() => { setEditMode(false); setName(profile?.name ?? ""); setMobileNumber(profile?.mobileNumber ?? ""); }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm transition"
              >
                Modifier le profil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
