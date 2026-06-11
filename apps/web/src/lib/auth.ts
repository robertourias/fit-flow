import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@fitflow/db'
import { validateOtp } from '@/lib/otp'

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google só retorna tokens OAuth para emails verificados, então é seguro
      // linkar automaticamente a uma conta existente (senha) com o mesmo email.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        otp: { type: 'text' },
        signupSigninToken: { type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        if (!email) return null

        // Post-signup auto-signin path (no OTP required — email was just verified)
        const signupSigninToken = credentials?.signupSigninToken as string
        if (signupSigninToken) {
          const tokenRecord = await prisma.verificationToken.findUnique({
            where: { token: signupSigninToken },
          })
          if (
            !tokenRecord ||
            tokenRecord.identifier !== email ||
            tokenRecord.purpose !== 'POST_SIGNUP_SIGNIN' ||
            tokenRecord.expires < new Date()
          ) {
            return null
          }
          await prisma.verificationToken.deleteMany({ where: { token: signupSigninToken } })
          const user = await prisma.user.findUnique({ where: { email } })
          if (!user) return null
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hasOnboarded: user.hasOnboarded as any,
          }
        }

        // Normal OTP path
        const otp = credentials?.otp as string
        if (!otp) return null

        const result = await validateOtp(email, otp, 'LOGIN_OTP')
        if (!result.valid) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || user.deletedAt) return null

        if (!user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hasOnboarded: user.hasOnboarded as any,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(token as any).id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { hasOnboarded: true },
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(token as any).hasOnboarded = dbUser?.hasOnboarded ?? false
      }
      if (trigger === 'update' && session?.hasOnboarded !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(token as any).hasOnboarded = session.hasOnboarded
      }
      return token
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session.user as any).id = (token as any).id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session.user as any).hasOnboarded = (token as any).hasOnboarded ?? false
      return session
    },
    async signIn({ account, profile }) {
      if (account?.provider === 'google' && profile?.name) {
        const email = profile.email
        if (email) {
          await prisma.user
            .update({ where: { email }, data: { name: profile.name } })
            .catch(() => {})
        }
      }
      return true
    },
  },
})

export const { handlers } = nextAuth

// TS2742 workaround: next-auth v5 beta referencia paths internos que tsc não nomeia em pnpm monorepos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: (...args: any[]) => any = nextAuth.auth
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn: (...args: any[]) => any = nextAuth.signIn
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut: (...args: any[]) => any = nextAuth.signOut
