"use client"
import dynamic from "next/dynamic";

// ✅ ssr: false → ZegoUIKitPrebuilt ne sera jamais exécuté côté serveur
const ZegoComponent = dynamic(() => import("../../components/ZegoComponent"), { ssr: false });

export default function Page() {
  return <ZegoComponent />;
}