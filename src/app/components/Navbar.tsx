"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Bike, Car, ChevronRight, LogOut, Truck } from "lucide-react";
import { signOut } from "next-auth/react";
import { setUserData } from "@/redux/userSlice";
import { useSession } from "next-auth/react";
import axios from "axios";
import { getSocket } from "@/lib/socket";

function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { userData } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    dispatch(setUserData(null));
    setProfileOpen(false);
  };

  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) {
      dispatch(setUserData(null));
    }
    // useGetAdmin (via InitUser) handles setting the full user data from DB.
    // We only handle the logout/clear case here to avoid overwriting rich DB fields
    // (partnerOnBoardingSteps, partnerStatus, etc.) with the partial session object.
  }, [session?.user?.id, dispatch]);

  useEffect(() => {
    if (!userData?.role || userData.role !== "partner") return;

    const fetchCount = async () => {
      try {
        const { data } = await axios.get(
          "/api/partner/bookings/pending-requests-count",
        );
        setPendingCount(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15000);

    const socket = getSocket();
    socket.on("new-booking", () => fetchCount());

    const onExternalChange = () => fetchCount();
    window.addEventListener("pending-count-changed", onExternalChange);

    return () => {
      clearInterval(interval);
      socket.off("new-booking");
      window.removeEventListener("pending-count-changed", onExternalChange);
    };
  }, [userData?.role]);

  return (
    <>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-3 left-0 right-0 mx-3 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[86%] md:mx-0 z-50 rounded-full bg-[#0B0B0B]
          text-white shadow-[0_15px_50px_rgba(0,0,0,0.7)] py-3`}
      >
        <div className="max-w-7xl mx-auto px-3 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#EAB308] flex items-center justify-center">
            <span className="text-white font-black text-xl">M</span>
            </div>
            <p className="text-white font-bold text-2xl tracking-tight">
             Ma<span className="text-[#EAB308]">Ride</span><span className="text-[#EAB308]">.</span>
                </p>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {userData?.role === "partner" && (
              <>
                <Link
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition"
                  href={"/"}
                >
                  Accueil
                </Link>
                <Link
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition"
                  href={"/partner/pending-requests"}
                >
                  Demandes en attente
                  <span
                    className="absolute -top-2 -right-5 w-6 h-6 bg-white text-black
                    text-xs rounded-full flex items-center justify-center font-bold"
                  >
                    {pendingCount ?? 0}
                  </span>
                </Link>
                <Link
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition"
                  href={"/partner/bookings"}
                >
                  Réservations
                </Link>
                <button
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition"
                  onClick={async () => {
                    try {
                      const { data } = await axios.get("/api/partner/my-active");
                      router.push(
                        data?._id
                          ? `/partner/active-ride?bookingId=${data._id}`
                          : "/partner/active-ride",
                      );
                    } catch {
                      router.push("/partner/active-ride");
                    }
                  }}
                >
                  Trajet Actif
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Desktop profile button */}
            <div className="hidden md:block relative">
              {!userData ? (
                <button
                  className="px-4 py-1.5 rounded-full bg-white text-black text-sm"
                  onClick={() => setAuthOpen(true)}
                >
                  Se connecter
                </button>
              ) : (
                <>
                  <button
                    className="w-11 h-11 rounded-full bg-white text-black"
                    onClick={() => setProfileOpen((p) => !p)}
                  >
                    {userData.name.charAt(0).toUpperCase()}
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-14 right-0 w-[300px] bg-white text-black rounded-2xl shadow-xl border z-[100]"
                      >
                        <div className="p-5">
                          <p className="font-semibold text-lg">{userData.name}</p>
                          <p className="text-sm uppercase text-gray-500 mb-4">
                            {userData.role === "admin"
                              ? "Administrateur"
                              : userData.role === "partner"
                                ? "Partenaire"
                                : "Utilisateur"}
                          </p>
                          {userData.role !== "partner" && userData.role !== "admin" && (
                            <div
                              className="w-full flex items-center gap-3 pl-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                              onClick={() => { router.push("/user/profile"); setProfileOpen(false); }}
                            >
                              Mon Profil
                              <ChevronRight size={16} className="ml-auto" />
                            </div>
                          )}
                          {userData.role !== "partner" && userData.role !== "admin" && (
                            <div
                              className="w-full flex items-center gap-3 pl-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                              onClick={() => router.push("/user/bookings")}
                            >
                              Réservations
                              <ChevronRight size={16} className="ml-auto" />
                            </div>
                          )}
                          {userData.role === "admin" && (
                            <div
                              className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                              onClick={() => router.push("/admin/dashboard")}
                            >
                              Dashboard Admin
                              <ChevronRight size={16} className="ml-auto" />
                            </div>
                          )}
                          {userData.role === "admin" && (
                            <div
                              className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                              onClick={() => router.push("/admin/wallet")}
                            >
                              Gestion dépôts
                              <ChevronRight size={16} className="ml-auto" />
                            </div>
                          )}
                          {userData.role !== "partner" && userData.role !== "admin" && (
                            <div
                              className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                              onClick={() => router.push("/partner/onboarding/vehicle")}
                            >
                              <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                                  <Bike size={14} />
                                </div>
                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                                  <Car size={14} />
                                </div>
                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                                  <Truck size={14} />
                                </div>
                              </div>
                              Devenir Partenaire
                              <ChevronRight size={16} className="ml-auto" />
                            </div>
                          )}
                          <button
                            className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl mt-2"
                            onClick={handleLogout}
                          >
                            <LogOut size={16} />
                            Déconnexion
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Mobile profile button */}
            <div className="md:hidden">
              {!userData ? (
                <button
                  className="px-4 py-1.5 rounded-full bg-white text-black text-sm"
                  onClick={() => setAuthOpen(true)}
                >
                  Se connecter
                </button>
              ) : (
                <button
                  className="w-11 h-11 rounded-full bg-white text-black"
                  onClick={() => setProfileOpen((p) => !p)}
                >
                  {userData.name.charAt(0).toUpperCase()}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile bottom sheet profile */}
      <AnimatePresence>
        {profileOpen && userData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-[60] max-h-[80vh] overflow-y-auto md:hidden min-h-fit pb-8"
            >
              <div className="p-5">
                <p className="font-semibold text-lg">{userData.name}</p>
                <p className="text-sm uppercase text-gray-500 mb-4">
                  {userData.role === "admin"
                    ? "Administrateur"
                    : userData.role === "partner"
                      ? "Partenaire"
                      : "Utilisateur"}
                </p>

                {userData.role === "admin" && (
                  <div
                    className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                    onClick={() => { router.push("/admin/dashboard"); setProfileOpen(false); }}
                  >
                    Dashboard Admin
                    <ChevronRight size={16} className="ml-auto" />
                  </div>
                )}

                {userData.role === "admin" && (
                  <div
                    className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                    onClick={() => { router.push("/admin/wallet"); setProfileOpen(false); }}
                  >
                    Gestion dépôts
                    <ChevronRight size={16} className="ml-auto" />
                  </div>
                )}

                {userData.role !== "partner" && userData.role !== "admin" && (
                  <div
                    className="w-full flex items-center gap-3 pl-3 pt-3 pb-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                    onClick={() => { router.push("/user/profile"); setProfileOpen(false); }}
                  >
                    Mon Profil
                    <ChevronRight size={16} className="ml-auto" />
                  </div>
                )}

                {userData.role !== "partner" && userData.role !== "admin" && (
                  <div
                    className="w-full flex items-center gap-3 pl-3 pt-3 pb-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                    onClick={() => { router.push("/user/bookings"); setProfileOpen(false); }}
                  >
                    Réservations
                    <ChevronRight size={16} className="ml-auto" />
                  </div>
                )}

                {userData.role !== "partner" && userData.role !== "admin" && (
                  <div
                    className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                    onClick={() => { router.push("/partner/onboarding/vehicle"); setProfileOpen(false); }}
                  >
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <Bike size={14} />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <Car size={14} />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <Truck size={14} />
                      </div>
                    </div>
                    Devenir Partenaire
                    <ChevronRight size={16} className="ml-auto" />
                  </div>
                )}

                {userData.role === "partner" && (
                  <>
                    <div
                      className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                      onClick={() => { router.push("/partner/pending-requests"); setProfileOpen(false); }}
                    >
                      Demandes en attente
                      <span className="ml-auto w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {pendingCount ?? 0}
                      </span>
                    </div>
                    <div
                      className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                      onClick={() => { router.push("/partner/bookings"); setProfileOpen(false); }}
                    >
                      Mes réservations
                      <ChevronRight size={16} className="ml-auto" />
                    </div>
                    <div
                      className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                      onClick={async () => {
                        try {
                          const { data } = await axios.get("/api/partner/my-active");
                          router.push(
                            data?._id
                              ? `/partner/active-ride?bookingId=${data._id}`
                              : "/partner/active-ride",
                          );
                        } catch {
                          router.push("/partner/active-ride");
                        }
                        setProfileOpen(false);
                      }}
                    >
                      Trajet actif
                      <ChevronRight size={16} className="ml-auto" />
                    </div>
                    <div
                      className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl cursor-pointer"
                      onClick={() => { router.push("/partner/wallet"); setProfileOpen(false); }}
                    >
                      Wallet
                      <ChevronRight size={16} className="ml-auto" />
                    </div>
                  </>
                )}

                <button
                  className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl mt-2"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default Navbar;
