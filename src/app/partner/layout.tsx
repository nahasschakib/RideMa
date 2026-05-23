import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PartnerNavbar from "@/app/components/PartnerNavbar";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");
  if (session.user.role !== "partner" && session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <>
      <PartnerNavbar />
      <div className="pt-20">{children}</div>
    </>
  );
}