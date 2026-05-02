"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, FileCheck, UploadCloud, CheckCircle, CircleDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import type { AxiosError } from "axios";

type docsType = "identity" | "drivingLicense" | "vehicleRegistration";

function Page() {
  const router = useRouter();
  const [docs, setDocs] = useState<Record<docsType, File | null>>({
    identity: null,
    drivingLicense: null,
    vehicleRegistration: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDocs = async () => {
    setError("");

    // ✅ Validation avant envoi
    if (!docs.identity || !docs.drivingLicense || !docs.vehicleRegistration) {
      setError("Veuillez télécharger tous les documents requis.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      // ✅ Logique corrigée (était inversée) + clés alignées avec l'API
      formData.append("identity",docs.identity);
      formData.append("drivingLicense",docs.drivingLicense);
      formData.append("vehicleRegistration",docs.vehicleRegistration);

      const { data } = await axios.post("/api/partner/onboarding/documents",formData);
      console.log("Réponse succès :", data);
      router.push("/");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setError(axiosError?.response?.data?.message || "Une erreur est survenue");
      console.error("Réponse erreur :", error);
     
    } finally {
      setLoading(false);
    }
  };

  const handleImage = (doc: docsType, file: File | null) => {
    if (!file) return;
    setDocs((prev) => ({ ...prev, [doc]: file }));
  };

  const DocLabel = ({
    doc,
    title,
    descriptions,
  }: {
    doc: docsType;
    title: string;
    descriptions: string[];
  }) => {
    const uploaded = !!docs[doc];
    return (
      <motion.label
        whileHover={{ scale: 1.02 }}
        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
          uploaded ? "border-black bg-gray-50" : "border-gray-200 hover:border-black"
        }`}
      >
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {descriptions.map((d, i) => (
            <p key={i} className="text-xs text-gray-500">{d}</p>
          ))}
          {/* ✅ Feedback visuel quand le fichier est sélectionné */}
          {uploaded && (
            <p className="text-xs text-green-600 font-medium mt-1">
              {docs[doc]?.name}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">
            {uploaded ? "Modifié" : "Télécharger"}
          </span>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              uploaded ? "bg-green-500 text-white" : "bg-black text-white"
            }`}
          >
            {uploaded ? <CheckCircle size={18} /> : <UploadCloud size={18} />}
          </div>
        </div>
        <input
          type="file"
          hidden
          accept="image/*,.pdf"
          onChange={(e) => handleImage(doc, e.target?.files?.[0] || null)}
        />
      </motion.label>
    );
  };

  const isCompleted=docs.identity && docs.drivingLicense && docs.vehicleRegistration
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl bg-white rounded-3xl border border-gray-200 shadow-[0_25px_70px_rgba(0,0,0,0.15)] p-6 sm:p-8"
      >
        <div className="relative text-center">
          <button
            className="absolute left-0 top-0 w-9 h-9 rounded-full text-gray-400 hover:text-gray-600 border border-gray-300 flex items-center justify-center transition-colors duration-300"
            onClick={() => router.push("/partner/onboarding/vehicle")}
          >
            <ArrowLeft size={18} />
          </button>

          <p className="text-xs text-gray-500 font-medium">étape 2 sur 3</p>

          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            télécharger des documents
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez télécharger les documents requis pour votre véhicule
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <DocLabel
            doc="identity"
            title="Preuve d'identité"
            descriptions={[
              "Carte d'identité Nationale Electronique",
              "Fiche anthropométrique",
              "Passport /ou Identité Numérique",
            ]}
          />
          <DocLabel
            doc="drivingLicense"
            title="Permis de conduire"
            descriptions={["Permis de conduire valide"]}
          />
          <DocLabel
            doc="vehicleRegistration"
            title="Documents Immatriculation de Véhicule"
            descriptions={["carte grise (certificat d'immatriculation)"]}
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-4">*{error}</p>}

        <div className="mt-6 flex items-start gap-3 text-xs text-gray-500">
          <FileCheck size={16} className="mt-0.5" />
          <p>
            Documents sont stockés en toute sécurité et vérifiés manuellement
            par notre équipe.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleDocs}
          disabled={(!isCompleted || loading) || undefined }
          className="mt-8 w-full h-14 rounded-2xl bg-black text-white gap-2 flex items-center justify-center font-semibold hover:bg-gray-800 disabled:opacity-40 transition"
        >
          {loading ? <CircleDashed className="text-white animate-spin"/>: "Continuer"}
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Page;