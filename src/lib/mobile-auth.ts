import { auth } from "@/auth";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

export async function getEmailFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      return payload.email as string;
    } catch {
      return null;
    }
  }
  const session = await auth();
  return session?.user?.email ?? null;
}