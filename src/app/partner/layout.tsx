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
   <div className="h-screen flex flex-col overflow-hidden">
      <PartnerNavbar />
      <div className="flex-1 overflow-auto pt-20 mt-3">
        {children}
      </div>
    </div>
  );
}