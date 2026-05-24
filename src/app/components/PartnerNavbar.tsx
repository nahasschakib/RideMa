"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { LogOut, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { setUserData } from "@/redux/userSlice";
import axios from "axios";

const PARTNER_NAV = [
  { label: "Demandes en attente", href: "/partner/pending-requests", badge: true },
  { label: "Mes réservations", href: "/partner/bookings" },
  { label: "Trajet actif", href: "/partner/active-ride" },
  { label: "Wallet", href: "/partner/wallet" },
];

export default function PartnerNavbar() {
  const pathName = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector((state: RootState) => state.user);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    dispatch(setUserData(null));
    router.push("/");
  };

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await axios.get(
          "/api/partner/bookings/pending-requests-count",
        );
        setPendingCount(data ?? 0);
      } catch {
        // silent
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const initial = userData?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-3 left-1/2 -translate-x-1/2
          w-[94%] md:w-[86%] z-50 rounded-full bg-[#0B0B0B]
          text-white shadow-[0_15px_50px_rgba(0,0,0,0.7)] py-3"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo1.png" alt="logo" width={50} height={50} priority />
            <p className="text-white font-semibold text-4xl">MaRide.</p>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {PARTNER_NAV.map((item) => {
              const active = pathName === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-sm font-medium transition ${
                    active ? "text-white" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span
                      className="absolute -top-2 -right-5 w-5 h-5 bg-white text-black
                        text-xs rounded-full flex items-center justify-center font-bold"
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: avatar + hamburger */}
          <div className="flex items-center gap-3 relative">
            {/* Desktop avatar */}
            <div className="hidden md:block relative">
              <button
                className="w-11 h-11 rounded-full bg-white text-black font-semibold text-sm"
                onClick={() => setProfileOpen((p) => !p)}
              >
                {initial}
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-14 right-0 w-[260px] bg-white text-black rounded-2xl shadow-xl border"
                  >
                    <div className="p-5">
                      <p className="font-semibold text-lg">{userData?.name}</p>
                      <p className="text-sm uppercase text-gray-500 mb-4">
                        Partenaire
                      </p>
                      <button
                        className="w-full flex items-center gap-3 py-3
                          hover:bg-gray-100 rounded-xl"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile avatar */}
            <div className="md:hidden">
              <button
                className="w-11 h-11 rounded-full bg-white text-black font-semibold text-sm"
                onClick={() => setProfileOpen((p) => !p)}
              >
                {initial}
              </button>
            </div>

            {/* Hamburger */}
            <button
              className="md:hidden text-white"
              onClick={() => setMenuOpen((p) => !p)}
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile menu */}
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
              className="fixed top-[85px] left-1/2 -translate-x-1/2 w-[92%]
                bg-[#0B0B0B] rounded-2xl shadow-2xl z-40 md:hidden overflow-hidden"
            >
              <div className="flex flex-col divide-y divide-white/10">
                {PARTNER_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-6 py-4 text-gray-300 hover:bg-white/5"
                  >
                    {item.label}
                    {item.badge && pendingCount > 0 && (
                      <span
                        className="w-5 h-5 bg-white text-black text-xs
                          rounded-full flex items-center justify-center font-bold"
                      >
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile profile bottom sheet */}
      <AnimatePresence>
        {profileOpen && (
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
                <p className="font-semibold text-lg">{userData?.name}</p>
                <p className="text-sm uppercase text-gray-500 mb-4">Partenaire</p>
                <button
                  className="w-full flex items-center gap-3 py-3
                    hover:bg-gray-100 rounded-xl"
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
    </>
  );
}
