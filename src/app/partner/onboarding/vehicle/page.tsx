"use client";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Bike, Car, Truck, Van, Package, CircleDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";

// ✅ Les id correspondent exactement aux valeurs enum du modèle Mongoose
const vehicleTypes = [
  {
    id: "motocycle",
    label: "Moto",
    icon: Bike,
    desc: "2 Roues, petits colis et livraisons rapides.",
  },
  {
    id: "car",
    label: "Voiture",
    icon: Car,
    desc: "4 Roues, colis de taille moyenne et livraisons plus longues.",
  },
  {
    id: "van",
    label: "SUVs",
    icon: Van,
    desc: "4 Roues, colis volumineux et livraisons multiples.",
  },
  {
    id: "truck",
    label: "Camion",
    icon: Truck,
    desc: "4 Roues, colis lourds et livraisons en grande quantité.",
  },
  {
    id: "other",
    label: "Fourgons",
    icon: Package,
    desc: "4 Roues, livraisons de marchandises en vrac ou déménagements.",
  },
];

function Page() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVehicle = async () => {
       setError("");

    // ✅ Validation avant envoi
    if (!selectedVehicle) {
      setError("Veuillez sélectionner un type de véhicule.");
      return;
    }
    if (!vehicleNumber.trim()) {
      setError("Veuillez entrer le numéro de votre véhicule.");
      return;
    }
    if (!vehicleModel.trim()) {
      setError("Veuillez entrer le modèle de votre véhicule.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post("/api/partner/onboarding/vehicle", {
        type: selectedVehicle,
        number: vehicleNumber,
        vehicleModel: vehicleModel,
      });
      setLoading(false)
      router.push("/partner/onboarding/documents");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
            setError(axiosError?.response?.data?.message || "Une erreur est survenue");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleGetVehicle = async () => {
      try {
        const { data } = await axios.get("/api/partner/onboarding/vehicle");
        setSelectedVehicle(data.vehicle.type);
        setVehicleNumber(data.vehicle.number);
        setVehicleModel(data.vehicle.model);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return;
        console.error(error);
      }
    };

    handleGetVehicle();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white sm:p-8 p-6 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.15)] border-gray-200 w-full max-w-xl"
      >
        <div className="relative text-center">
          <button
            className="absolute left-0 top-0 w-9 h-9 rounded-full text-gray-400 hover:text-gray-600 border border-gray-300 flex items-center justify-center transition-colors duration-300"
            onClick={() => router.push("/")}
          >
            <ArrowLeft size={18} />
          </button>

          <p className="text-xs text-gray-500 font-medium">étape 1 sur 3</p>

          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            détails du véhicule
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Ajoutez les détails de votre véhicule pour compléter votre
            inscription en tant que partenaire de transport.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">
              type de véhicule
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {vehicleTypes.map((vehicle) => {
                const Icon = vehicle.icon;
                const isSelected = selectedVehicle === vehicle.id;
                return (
                  <motion.div
                    key={vehicle.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    className={`border rounded-2xl flex flex-col items-center gap-2 p-4 hover:border-black transition cursor-pointer
                      ${isSelected ? "border-gray-200 bg-black text-white" : "border-gray-300"}`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-white text-black" : "bg-black text-white"
                      }`}
                    >
                      <Icon />
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {vehicle.label}
                    </div>
                    <p
                      className={`text-xs text-center font-semibold ${
                        isSelected ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {vehicle.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="vehicleNumber"
              className="text-xs font-semibold text-gray-500"
            >
              numéro de véhicule
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              id="vehicleNumber"
              placeholder="Entrez le numéro de votre véhicule"
              className="mt-2 w-full text-sm border-b border-gray-300 pb-2 focus:outline-none focus:border-black transition"
            />
          </div>

          <div>
            <label
              htmlFor="vehicleModel"
              className="text-xs font-semibold text-gray-500"
            >
              modèle de véhicule
            </label>
            <input
              type="text"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              id="vehicleModel"
              placeholder="Entrez le modèle de votre véhicule"
              className="mt-2 w-full text-sm border-b border-gray-300 pb-2 focus:outline-none focus:border-black transition"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-4">*{error}</p>}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          disabled={loading}
          className="mt-8 w-full h-14 rounded-2xl bg-black text-white gap-2 flex items-center justify-center font-semibold hover:bg-gray-800 disabled:opacity-40 transition"
          onClick={handleVehicle}
        >
          {loading ? <CircleDashed className="text-white animate-spin"/> : "Continuer"}
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Page;