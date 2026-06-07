import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SocketIdentity from "@/app/components/SocketIdentity";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/");
  return (
    <>
      <SocketIdentity userId={session.user.id} />
      {children}
    </>
  );
}
