import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "@/lib/Provider";
import ReduxProvider from "@/redux/ReduxProvider";
import InitUser from "@/InitUser";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MaRide - Plateforme de gestion des reservations des vehicules",
  description:
    "MaRide est une plateforme moderne de location de véhicules multi-vendeurs permettant aux utilisateurs de réserver facilement des voitures, des motos et des véhicules utilitaires. Grâce à une connexion sécurisée, des propriétaires vérifiés et une tarification transparente, MaRide simplifie et fiabilise la mobilité.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col ">
        <Provider>
          <ReduxProvider>
            <InitUser />


            {children}
          </ReduxProvider>
        </Provider>
      </body>
    </html>
  );
}
