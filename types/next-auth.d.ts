import NextAuth, { DefaultSession } from "next-auth"
import { UserRole, UserStatus } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      organizationId?: string
      status: UserStatus
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    organizationId?: string
    status: UserStatus
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    organizationId?: string
    status: UserStatus
  }
}
