"use client";
import React from "react";
import { motion } from "motion/react";
import { FaFacebook, FaInstagram, FaLinkedinIn } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";

function Footer() {
  return (
    <div className="w-full bg-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.06, ease: "easeInOut" }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-16"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h2 className="text-2xl font-bold tracking-wide">RideMa</h2>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Réservez n&apos;importe quel véhicule, du vélo au camion.
              Propriétaires de confiance. Tarification transparente.
            </p>
            <div className="flex mt-6 gap-6">
              {[FaXTwitter, FaFacebook, FaInstagram, FaLinkedinIn].map(
                (Icon, i) => {
                  return (
                    <motion.a
                      key={i}
                      whileHover={{ y: -3 }}
                      href="#"
                      className="w-10 h-10 flex items-center justify-center rounded-full border
                border-white/10 hover:bg-white hover:text-black transition"
                    >
                      <Icon size={18} />
                    </motion.a>
                  );
                },
              )}
            </div>
           </div></div>
            <div className="border-t border-white/10">
              <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row
              justify-between items-center text-xs text-gray-500 gap-4">
                <p>
                  <span>©</span> {new Date().getFullYear()} RideMA. Tous
                  droits réservés
                </p>
             </div>
           </div>
        
       
      </motion.div>
    </div>
  );
}

export default Footer;
