declare module "next-auth" {
  interface User {
    role: string
  }
  interface Session {
    user: {
      id: string
      role: string
    } & import("next-auth").DefaultSession["user"]
  }
}

export {}