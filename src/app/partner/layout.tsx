// app/partner/layout.tsx
import Navbar from "@/app/components/Navbar"

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}