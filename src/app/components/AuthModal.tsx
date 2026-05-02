"use client";
import React, { useState } from "react";
import { AnimatePresence, easeOut, motion } from "motion/react";
import { CircleDashed, Lock, Mail, User, X } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { signIn, useSession } from "next-auth/react";

type propType = {
  open: boolean;
  onClose: () => void;
};

type stepType = "S'inscrire" | "Se connecter" | "otp";
export default function AuthModal({ open, onClose }: propType) {
  const [step, setStep] = useState<stepType>("Se connecter");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const session = useSession();
  console.log(session.data?.user);

  const handleClose = () => {
    setStep("Se connecter");
    setName("");
    setEmail("");
    setPassword("");
    setErr("");
    setOtp(["", "", "", "", "", ""]);
    onClose();
  };

  const handleSignUp = async () => {
   
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      console.log(data); 
      setErr("")
      setStep("otp");
      setLoading(false);
    } catch (error) {
        const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Une erreur est survenue";
      setErr(message);
    }finally{
      setLoading(false);
    }
  };
  const handleVerifyEmail = async () => {
    if (otp.some((digit) => digit === "")) {
      setErr("Veuillez entrer les 6 chiffres du code OTP.");
      return;
    }
   
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/verify-email", {
        email,
        otp: otp.join(""),
      });
      console.log(data);
       setErr(""); 
      setStep("Se connecter");
      setLoading(false);
    } catch (error) {
          const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Une erreur est survenue";
      setErr(message);
    }finally{
      setLoading(false);
    }
  };
  const handleSignIn = async () => {
  setErr("")
  setLoading(true);
  try {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setErr("Email ou mot de passe incorrect.");
    } else {
      handleClose();
      // ✅ Récupérer la session et rediriger selon le role
      const session = await fetch("/api/auth/session").then(r => r.json());
      const role = session?.user?.role;
      if (role === "admin")        window.location.href = "/admin/dashboard";
      else if (role === "partner") window.location.href = "/partner/dashboard";
      else                         window.location.href = "/";
    }
  } catch {
    setErr("Une erreur est survenue lors de la connexion.");
  } finally {
    setLoading(false);
  }
};

 const handleGoogleSignIn = async () => {
  await signIn("google", { callbackUrl: "/api/auth/redirect-by-role" });
};

  const handleChangeOtp = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
    if (!value && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOut }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            >
              <div
                className="relative w-full max-w-md rounded-3xl bg-white border
                 border-black/10 shadow-[0_40px_100px_rgba(0,0,0,0.35)] p-6 sm:p-8 text-black"
              >
                <div
                  className="absolute right-4 top-4 text-gray-500 hover:text-black transition"
                  onClick={handleClose}
                >
                  <X size={20} />
                </div>
                <div className="mb-6 text-center">
                  <h1 className="text-3xl font-extrabold tracking-widest">
                    RideMa
                  </h1>
                  <p className="mt-1 text-xs text-gray-500">
                    Réservation de véhicule Haute game
                  </p>
                </div>
                <button
                  className="w-full h-11 rounded-xl border border-black/20
                  flex items-center justify-center gap-3 hover:bg-black hover:text-white transition"
                  onClick={handleGoogleSignIn}
                >
                  <Image
                    src={"/google.png"}
                    alt="google"
                    width={20}
                    height={20}
                  />
                  Continuer avec Google
                </button>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-black/10" />
                  <div className="text-xs text-gray-500">OU</div>
                  <div className="flex-1 h-px bg-black/10" />
                </div>

                <div className="">
                  {step == "S'inscrire" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <h1 className="text-xl font-semibold">Créer un compte</h1>
                      <div className="mt-5 space-y-4">
                        <div className="flex items-center gap-3 border border-black/20 rounded-xl px-4 py-3">
                          <User size={18} className="text-gray-500" />
                          <input
                            type="text"
                            placeholder="Nom et Prénom"
                            className="w-full bg-transparent outline-none text-sm"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                          />
                        </div>
                        <div className="flex items-center gap-3 border border-black/20 rounded-xl px-4 py-3">
                          <Mail size={18} className="text-gray-500" />
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full bg-transparent outline-none text-sm"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                          />
                        </div>
                        <div className="flex items-center gap-3 border border-black/20 rounded-xl px-4 py-3">
                          <Lock size={18} className="text-gray-500" />
                          <input
                            type="password"
                            placeholder="Mot de passe"
                            className="w-full bg-transparent outline-none text-sm"
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                          />
                        </div>
                        {err && <p className="text-red-500">* {err}</p>}

                        <button
                          className="w-full h-11 rounded-xl bg-black
                      text-white font-semibold hover:bg-gray-900 flex justify-center items-center"
                          disabled={loading}
                          onClick={handleSignUp}
                        >
                          {!loading ? (
                            "Send opt"
                          ) : (
                            <CircleDashed
                              size={18}
                              color="white"
                              className="animate-spin"
                            />
                          )}
                        </button>
                      </div>
                      <p className="mt-6 text-center text-sm text-gray-500">
                        J&apos;ai déjà un compte{" "}
                      </p>
                      <div
                        onClick={() => setStep("Se connecter")}
                        className="text-black font-medium  text-center hover:underline"
                      >
                        Se connecter{" "}
                      </div>
                    </motion.div>
                  )}
                  {step == "Se connecter" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <h1 className="text-xl font-semibold">
                        Heureux de votre Retour
                      </h1>
                      <div className="mt-5 space-y-4">
                        <div className="flex items-center gap-3 border border-black/20 rounded-xl px-4 py-3">
                          <Mail size={18} className="text-gray-500" />
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full bg-transparent outline-none text-sm"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                          />
                        </div>
                        <div className="flex items-center gap-3 border border-black/20 rounded-xl px-4 py-3">
                          <Lock size={18} className="text-gray-500" />
                          <input
                            type="password"
                            placeholder="Mot de passe"
                            className="w-full bg-transparent outline-none text-sm"
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                          />
                        </div>
                        {err && <p className="text-red-500 text-sm">{err}</p>}
                        <button
                          className="w-full h-11 rounded-xl bg-black
                           text-white font-semibold hover:bg-gray-900 transition flex items-center justify-center"
                          onClick={handleSignIn}
                        >
                          {!loading ? (
                            "Se connecter"
                          ) : (
                            <CircleDashed
                              size={18}
                              color="white"
                              className="animate-spin"
                            />
                          )}
                        </button>
                      </div>
                      <p className="mt-6 text-center text-sm text-gray-500 ">
                        Vous n&apos;avez pas de compte ?{" "}
                      </p>
                      <div
                        onClick={() => setStep("S'inscrire")}
                        className="text-black font-medium  text-center hover:underline"
                      >
                        S&apos;inscrire{" "}
                      </div>
                    </motion.div>
                  )}
                  {step == "otp" && (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-xl font-semibold">
                        Vérifier votre boite e-mails
                      </h2>
                      <div className="mt-6 flex justify-between gap-2">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            value={digit}
                            maxLength={1}
                            placeholder={""}
                            className="w-10 h-12 sm:w-12 text-center text-lg font-semibold
                            rounded-xl bg-white border border-black/20 outline-none"
                            onChange={(e) => handleChangeOtp(i, e.target.value)}
                          />
                        ))}
                      </div>
                                              {err && <p className="text-red-500 text-sm">{err}</p>}
                      <button
                        className="mt-6 w-full h-11 rounded-xl bg-black text-white
                      font-semibold hover:bg-gray-900 transition flex items-center justify-center"
                        onClick={handleVerifyEmail}>
                        {" "}
                        {!loading ? (
                          "Vérifiez le code OTP et créez un compte"
                        ) : (
                          <CircleDashed
                            size={18}
                            color="white"
                            className="animate-spin"/>
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
