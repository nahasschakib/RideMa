import PartnerNavbar from "@/app/components/PartnerNavbar";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PartnerNavbar />
      <div className="pt-20">{children}</div>
    </>
  );
}