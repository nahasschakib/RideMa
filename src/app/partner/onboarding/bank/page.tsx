"use client";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  CircleDashed,
  CreditCard,
  Landmark,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
      
  const ACCOUNT_REGEX = /^(\d{24}|MA\d{24})$/;

function Page() {
  const router = useRouter();
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ribiban, setRibiban] = useState("");
  const [mobilePaymentId, setMobilePaymentId] = useState("");
  const [mobilNumber, setMobilNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const sanitizedRibiban = ribiban.trim().replace(/\s+/g, '').toUpperCase();

 const isNameValid = accountHolder.trim().length >= 3;
 const isAccountNumberValid = accountNumber.trim().length === 24 && /^\d+$/.test(accountNumber.trim());
 const isPhoneNumberValid = mobilNumber.trim().length === 10;
 const isRibibanValid = ribiban.trim() === "" || ACCOUNT_REGEX.test(sanitizedRibiban);
  const isMobilePaymentIdValid = mobilePaymentId.trim() === "" || /^\d{10}$/.test(mobilePaymentId.trim());

 const canSubmit = isNameValid && isAccountNumberValid && isPhoneNumberValid && isRibibanValid && isMobilePaymentIdValid;

  const handleBank = async () => {
     setError("");
        // ✅ Validation avant envoi
    if (!accountHolder.trim()) {
      setError("Veuillez entrer le nom du titulaire du compte.");
      return;
    }
    if (!accountNumber.trim()) {
      setError("Veuillez entrer votre numéro de compte bancaire.");
      return;
    }
     if (!ribiban.trim()) {
      setError("Veuillez entrer votre numéro de RIB/IBAN.");
      return;
    }
    if (!mobilNumber.trim()) {
      setError("Veuillez entrer votre numéro de portable.");
      return;
    }

    try {
      setLoading(true);
     
      const { data } = await axios.post("/api/partner/onboarding/bank", {
        accountHolderName: accountHolder,
        accountNumber,
        ribiban: sanitizedRibiban,
        mobileNumber: mobilNumber,
        mobilePaymentId,
      });
      console.log("Réponse succès :", data);
      setLoading(false)
      window.location.href="/"
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setError(axiosError?.response?.data?.message || "Une erreur est survenue");
    } finally {
      // ✅ finally au lieu de setLoading(false) dans try ET catch
      setLoading(false);
    }
  };

  useEffect(()=>{
     const handleGetBank = async () => {
      try {        
        const { data } = await axios.get("/api/partner/onboarding/bank");
        console.log(data)
        setAccountHolder(data.partnerBank.accountHolder)
        setAccountNumber(data.partnerBank.accountNumber)
        setRibiban(data.partnerBank.ribiban)
        setMobilNumber(data.mobileNumber ?? "")
     
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setError(axiosError?.response?.data?.message || "Une erreur est survenue");
    } 
  };
  handleGetBank()
  },[])
 
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-white rounded-3xl border border-gray-200 shadow-[0_25px_70px_rgba(0,0,0,0.15)] p-6 sm:p-8"
      >
        <div className="relative text-center">
          <button
            className="absolute left-0 top-0 w-9 h-9 rounded-full text-gray-400 hover:text-gray-600 border border-gray-300 flex items-center justify-center transition-colors duration-300"
            onClick={() => router.push("/partner/onboarding/documents")}
          >
            <ArrowLeft size={18} />
          </button>

          <p className="text-xs text-gray-500 font-medium">étape 3 sur 3</p>

          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            Banques et Paiements
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez fournir vos informations bancaires pour recevoir vos
            paiements
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="accountHolder" className="text-xs font-semibold text-gray-500">
              Nom du titulaire du compte
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-gray-400"><BadgeCheck /></div>
              <input
                type="text"
                id="accountHolder"
                autoComplete="name"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Entrez le nom du titulaire du compte"
                className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isNameValid && accountHolder.length > 0 ?"border-red-400 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
              />
            </div>
            {!isNameValid && accountHolder.length > 0 && 
              <p className="text-red-500 text-xs mt-1">Minimum 3 caractères requis.</p>
            }
          </div>

          <div>
            <label htmlFor="accountNumber" className="text-xs font-semibold text-gray-500">
              Numéro de compte bancaire
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-gray-400"><CreditCard /></div>
              <input
                type="text"
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Entrez votre numéro de compte bancaire"
                className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isAccountNumberValid && accountNumber.length > 0 ?"border-red-400 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
              />
            </div>
           {!isAccountNumberValid && accountNumber.length > 0 && 
              <p className="text-red-500 text-xs mt-1">Numéro de compte doit comporter au moins 24 caractères..</p>
            }
          </div>

          <div>
            
            <label htmlFor="ribiban" className="text-xs font-semibold text-gray-500">
              RIB ou IBAN <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-gray-400"><Landmark /></div>
              <input
                type="text"
                id="ribiban"
                value={ribiban.toUpperCase()}
                onChange={(e) => setRibiban(e.target.value)}
                placeholder="Entrez le RIB ou l'IBAN de votre compte"
               className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isRibibanValid && ribiban.length > 0 ?"border-red-400 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
              />
            </div>
              {!isRibibanValid && ribiban.length > 0 && <p className="text-red-500 text-xs mt-1">Format RIB ou IBAN invalide.</p>}
          </div>

          <div>
            <label htmlFor="phoneNumber" className="text-xs font-semibold text-gray-500">
              Numéro de portable
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-gray-400"><Phone /></div>
              <input
                type="text"
                id="phoneNumber"
                value={mobilNumber}
                onChange={(e) => setMobilNumber(e.target.value)}
                placeholder="Entrez votre numéro de portable associé à votre compte"
                 className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isPhoneNumberValid && mobilNumber.length > 0 ?"border-red-400 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
              />
            </div>
            {!isPhoneNumberValid && mobilNumber.length > 0 && <p className="text-red-500 text-xs mt-1">Format de numéro de portable invalide.</p>}
          </div>

          <div>
            <label htmlFor="mobilePaymentId" className="text-xs font-semibold text-gray-500">
              Mobile QR payments <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                id="mobilePaymentId"
                value={mobilePaymentId}
                onChange={(e) => setMobilePaymentId(e.target.value)}
                placeholder="Numéro de téléphone ou ID de paiement mobile"
                className={`flex-1 border-b pb-2 text-sm focus:outline-none ${!isMobilePaymentIdValid && mobilePaymentId.length > 0 ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
              />
            </div>
              {!isMobilePaymentIdValid && mobilePaymentId.length > 0 && <p className="text-red-500 text-xs mt-1">Format d&apos;ID de paiement mobile invalide.</p>}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-4">*{error}</p>}

        <div className="mt-6 flex items-start gap-3 text-xs text-gray-500">
          <CheckCircle size={16} className="mt-0.5" />
          <p>
            Les coordonnées bancaires sont vérifiées avant le premier versement.
            Cela prend généralement entre 24 et 48 heures.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleBank}
          disabled={!canSubmit || loading}
          className="mt-8 w-full h-14 rounded-2xl bg-black text-white gap-2 flex items-center justify-center font-semibold hover:bg-gray-800 disabled:opacity-40 transition"
        >
          {loading ? <CircleDashed className="text-white animate-spin" /> : "Continuer"}
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Page;