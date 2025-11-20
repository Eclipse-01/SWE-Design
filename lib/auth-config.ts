import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole, UserStatus } from "@prisma/client"

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        if (user.status === 'BANNED') {
          throw new Error('账号已被封禁')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          organizationId: user.organizationId ?? undefined,
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/admin') || 
                           nextUrl.pathname.startsWith('/teacher') || 
                           nextUrl.pathname.startsWith('/student')
      const isOnAuthPage = nextUrl.pathname.startsWith('/login') || 
                           nextUrl.pathname.startsWith('/register')
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      } else if (isLoggedIn && isOnAuthPage) {
        // Redirect logged-in users away from login/register pages to their dashboard
        const role = auth.user.role
        if (role === 'SUPER_ADMIN') {
          return Response.redirect(new URL('/admin/dashboard', nextUrl))
        } else if (role === 'TEACHER') {
          return Response.redirect(new URL('/teacher/dashboard', nextUrl))
        } else {
          return Response.redirect(new URL('/student/dashboard', nextUrl))
        }
      }
      
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.status = user.status
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole
        session.user.organizationId = token.organizationId as string | undefined
        session.user.status = token.status as UserStatus
        session.user.id = token.sub as string
      }
      return session
    }
  }
} satisfies NextAuthConfig
