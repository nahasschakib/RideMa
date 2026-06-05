import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "./lib/db";
import User from "./models/user.model";

function toIdString(raw: unknown): string {
  if (typeof raw === "string") return raw;
  const r = raw as any;
  return r?.toHexString?.() ?? r?.path ?? String(r ?? "");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { type: "email",    label: "Email",    placeholder: "johndoe@gmail.com" },
        password: { type: "password", label: "Password", placeholder: "*****" },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          throw new Error("Missing credentials");
        }
        await dbConnect();
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("No user found with this email!");
        const isMatch = await bcrypt.compare(credentials.password as string, user.password);
        if (!isMatch) throw new Error("Invalid password!");
        return {
          id:    toIdString(user._id),
          name:  user.name,
          email: user.email,
          role:  user.role,
        };
      },
    }),
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
  if (account?.provider === "google") {
    await dbConnect();
    let existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      existingUser = await User.create({ 
        name: user.name, 
        email: user.email,
        role: "user"
      });
    }
    // ← Ces deux lignes sont critiques
    user.id   = toIdString(existingUser._id);
    user.role = existingUser.role;  // récupère "partner" depuis la vraie DB
  }
  return true;
},
    async jwt({ token, user }) {
  if (user) {
    await dbConnect();
    const dbUser = await User.findOne({ email: token.email });
    console.log("EMAIL CHERCHÉ:", token.email)
    console.log("DB USER TROUVÉ:", dbUser?.email, "ROLE:", dbUser?.role)
    token.role = dbUser?.role ?? "user";
    if (dbUser) token.id = toIdString(dbUser._id);
  }
  return token;
},
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = toIdString(token.id ?? token.sub);
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error:  "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge:   10 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
});
