import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@fitflow/db";
import { validateOtp } from "@/lib/otp";

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        otp: { type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const otp = credentials?.otp as string;
        if (!email || !otp) return null;

        const result = await validateOtp(email, otp);
        if (!result.valid) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        if (!user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hasOnboarded: user.hasOnboarded as any,
        };
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { hasOnboarded: true, id: true },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).hasOnboarded = dbUser?.hasOnboarded ?? false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = user.id;
      }
      return session;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.name) {
        const email = profile.email;
        if (email) {
          await prisma.user
            .update({ where: { email }, data: { name: profile.name } })
            .catch(() => {});
        }
      }
      return true;
    },
  },
});

export const { handlers } = nextAuth;

// TS2742 workaround: next-auth v5 beta referencia paths internos que tsc não nomeia em pnpm monorepos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: (...args: any[]) => any = nextAuth.auth;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn: (...args: any[]) => any = nextAuth.signIn;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut: (...args: any[]) => any = nextAuth.signOut;
