import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@fitflow/db";

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Providers (Google, Credentials, etc.) configurados em spec separada de autenticação
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
});

export const { handlers } = nextAuth;

// Anotações any necessárias para TS2742: next-auth v5 beta referencia caminhos internos
// (next-auth/lib, @auth/core/providers) que o tsc não consegue nomear em pnpm monorepos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: (...args: any[]) => any = nextAuth.auth;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn: (...args: any[]) => any = nextAuth.signIn;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut: (...args: any[]) => any = nextAuth.signOut;
