import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (role === "admin")        redirect("/admin/dashboard");
  else if (role === "partner") redirect("/partner/dashboard");
  else                         redirect("/");
}