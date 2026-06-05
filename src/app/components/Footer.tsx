"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { FaFacebook, FaInstagram } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";

const services = [
  { label: "Réserver un trajet", href: "/user/checkout" },
  { label: "Nos véhicules",      href: "/user/checkout" },
  { label: "Tarifs",             href: "/user/checkout" },
  { label: "Zones desservies",   href: "/" },
];

const partners = [
  { label: "Devenir chauffeur",  href: "/partner/onboarding/vehicle" },
  { label: "Espace partenaire",  href: "/partner/pending-requests" },
  { label: "Support",            href: "/contacts" },
  { label: "CGU",                href: "/cgu" },
];

const socials = [
  { Icon: FaXTwitter,  href: "https://x.com/maride" },
  { Icon: FaFacebook,  href: "https://facebook.com/maride" },
  { Icon: FaInstagram, href: "https://instagram.com/maride" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a" }} className="text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">

          {/* Colonne 1 — Logo + description */}
          <div>
            <Link href="/">
              <Image src="/logo1.png" alt="MaRide" width={120} height={40} className="object-contain" />
            </Link>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Du transport quotidien au transport lourd — tout sur une seule plateforme.
            </p>
          </div>

          {/* Colonne 2 — Services */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5">
              Services
            </h3>
            <ul className="space-y-3">
              {services.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-300 text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 — Partenaires */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5">
              Partenaires
            </h3>
            <ul className="space-y-3">
              {partners.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-300 text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bas du footer */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid #1a1a1a" }}
        >
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} MaRide. Tous droits réservés.
          </p>
          <div className="flex gap-3">
            {socials.map(({ Icon, href }) => (
              <motion.a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-white/15 hover:border-white/40 transition-colors"
              >
                <Icon size={15} />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
