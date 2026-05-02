"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Bike, Car, ChevronRight, LogOut, Menu, Truck, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { setUserData } from "@/redux/userSlice";
import { useSession } from "next-auth/react";
import axios from "axios";

const Navbar_Items = [
  { label: "Acceuil", href: "/" },
  { label: "Réservations", href: "/reservations" },
  { label: "À propos de nous", href: "/a-propos" },
  { label: "Contacts", href: "/contacts" },
];

function Navbar() {
  const pathName = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState();
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
    if (userData?.role !== "partner") return;

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
    return () => clearInterval(interval);
  }, [userData?.role]);

  return (
    <>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-3 left-1/2 -translate-x-1/2
          w-[94%] md:w-[86%] z-50 rounded-full bg-[#0B0B0B] 
          text-white shadow-[0_15px_50px_rgba(0,0,0,0.7)] py-3`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={"/logo1.png"}
              alt="logo"
              width={50}
              height={50}
              priority
            />
            <p className="text-white font-semibold text-4xl">MaRide.</p>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {userData?.role == "partner" ? (
              <>
                <Link
                  className="relative text-sm font-medium text-gray-300
               hover:text-white transition"
                  href={"/"}
                >
                  Acceuil
                </Link>
                <Link
                  className="relative text-sm font-medium text-gray-300
               hover:text-white transition"
                  href={"/partner/pending-requests"}
                >
                  Demandes en attente
                  <span
                    className="absolute -top-2 -right-5 w-6 h-6 bg-white text-black
                text-xs rounded-full flex items-center justify-center
               font-bold"
                  >
                    {pendingCount ?? 0}
                  </span>
                </Link>
                <Link
                  className="relative text-sm font-medium text-gray-300
               hover:text-white transition"
                  href={"/partner/reservations"}
                >
                  Réservations
                </Link>
                <Link
                  className="relative text-sm font-medium text-gray-300
               hover:text-white transition"
                  href={"/partner/active-ride"}
                >
                  Trajet Actif
                </Link>
              </>
            ) : (
              <>
                {Navbar_Items.map((i, index) => {
                  let href;
                  if (i.label == "Acceuil") {
                    href = `/`;
                  } else {
                    href = `/${i.label.toLowerCase()}`;
                  }

                  const active = href == pathName;
                  return (
                    <Link
                      href={href}
                      key={index}
                      className={`text-sm font-medium transition ${
                        active ? "text-white" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {i.label}
                    </Link>
                  );
                })}
              </>
            )}
          </div>
          <div className="flex items-center gap-3 relative">
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
                        className="absolute top-14 right-0 w-[300px] bg-white text-black rounded-2xl shadow-xl border"
                      >
                        <div className="p-5">
                          <p className="font-semibold text-lg">
                            {userData.name}
                          </p>
                          <p className="text-sm uppercase text-gray-500 mb=4">
                            {userData.role === "admin"
                              ? "Administrateur"
                              : userData.role === "partner"
                                ? "Partenaire"
                                : "Utilisateur"}
                          </p>
                          {userData.role === "admin" && (
                            <div
                              className="w-full flex items-center gap-3 py-3
                                    hover:bg-gray-100 rounded-xl cursor-pointer"
                              onClick={() => router.push("/admin/dashboard")}
                            >
                              Dashboard Admin
                              <ChevronRight size={16} className="ml-auto" />
                            </div>
                          )}
                          {userData.role !== "partner" &&
                            userData.role !== "admin" && (
                              <div
                                className="w-full flex items-center gap-3 py-3
                            hover:bg-gray-100 rounded-xl"
                                onClick={() =>
                                  router.push("/partner/onboarding/vehicle")
                                }
                              >
                                <div className="flex -space-x-2">
                                  <div
                                    className="w-6 h-6 rounded-full bg-black
                                  text-white flex items-center justify-center"
                                  >
                                    <Bike size={14} />
                                  </div>
                                  <div
                                    className="w-6 h-6 rounded-full bg-black
                                  text-white flex items-center justify-center"
                                  >
                                    <Car size={14} />
                                  </div>
                                  <div
                                    className="w-6 h-6 rounded-full bg-black
                                  text-white flex items-center justify-center"
                                  >
                                    <Truck size={14} />
                                  </div>
                                </div>
                                Devenir Partnaire
                                <ChevronRight size={16} className="ml-auto" />
                              </div>
                            )}
                          <button
                            className="w-full flex items-center gap-3 py-3 hover:bg-gray-100
                          rounded-xl mt-2"
                            onClick={handleLogout}
                          >
                            <LogOut size={16} />
                            déconnexion
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            <div className="md:hidden">
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
                </>
              )}
            </div>

            <button
              className="md:hidden text-white"
              onClick={() => setMenuOpen((p) => !p)}
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top=[85px] left-1/2 -translate-x-1/2 w-[92%]
             bg-[#0B0B0B] rounded-2xl shadow-2xl z-40 md:hidden overflow-hidden"
            >
              <div className="flex flex-col divide-y divide-white/10 py-20">
                {Navbar_Items.map((i, index) => {
                  let href;
                  if (i.label == "Acceuil") {
                    href = `/`;
                  } else {
                    href = `/${i.label.toLowerCase()}`;
                  }

                  return (
                    <Link
                      href={href}
                      key={index}
                      className="px-6 py-4 text-gray-300 hover:bg-white/5"
                    >
                      {i.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
            className="fixed inset-x-0 bottom-0 bg-white/80 rounded-t-3xl shadow-2xl z-50 md:hidden"
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
                  className="w-full flex items-center gap-3 py-3
                   hover:bg-gray-100 rounded-xl cursor-pointer"
                  onClick={() => router.push("/admin/dashboard")}
                >
                  Dashboard Admin
                  <ChevronRight size={16} className="ml-auto" />
                </div>
              )}
              {userData.role !== "partner" && userData.role !== "admin" && (
                <div
                  className="w-full flex items-center gap-3 py-3
                            hover:bg-gray-100 rounded-xl"
                  onClick={() => router.push("/partner/onboarding/vehicle")}
                >
                  <div className="flex -space-x-2">
                    <div
                      className="w-6 h-6 rounded-full bg-black
                                  text-white flex items-center justify-center"
                    >
                      <Bike size={14} />
                    </div>
                    <div
                      className="w-6 h-6 rounded-full bg-black
                                  text-white flex items-center justify-center"
                    >
                      <Car size={14} />
                    </div>
                    <div
                      className="w-6 h-6 rounded-full bg-black
                                  text-white flex items-center justify-center"
                    >
                      <Truck size={14} />
                    </div>
                  </div>
                  Devenir Partnaire
                  <ChevronRight size={16} className="ml-auto" />
                </div>
              )}
              <button
                className="w-full flex items-center gap-3 py-3 hover:bg-gray-100
                          rounded-xl mt-2"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                déconnexion
              </button>
            </div>
          </motion.div>
        </>
      )}
      <AnimatePresence></AnimatePresence>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default Navbar;
