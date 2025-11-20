import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

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
          organizationId: user.organizationId,
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
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      } else if (isLoggedIn) {
        // Redirect logged-in users to their dashboard
        const role = (auth.user as any).role
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
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
        token.status = (user as any).status
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).organizationId = token.organizationId as string
        (session.user as any).status = token.status as string
        (session.user as any).id = token.sub as string
      }
      return session
    }
  }
} satisfies NextAuthConfig
