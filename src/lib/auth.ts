import "server-only";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { burnPasswordCheck, verifyPassword } from "@/lib/tokens";
import { loginSchema } from "@/lib/validations/auth";
import { AUTH_ERRORS, SESSION_REMEMBER_SECONDS, SESSION_SHORT_SECONDS } from "@/lib/auth-errors";

export const facebookEnabled = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  // Credentials sign-in requires JWT sessions in NextAuth v4.
  session: { strategy: "jwt", maxAge: SESSION_REMEMBER_SECONDS },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
  providers: [
    ...(facebookEnabled
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
            authorization: { params: { scope: "email,public_profile" } },
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(raw, req) {
        const parsed = loginSchema.safeParse({
          email: raw?.email,
          password: raw?.password,
          remember: raw?.remember !== "false",
        });
        if (!parsed.success) throw new Error(AUTH_ERRORS.INVALID_INPUT);
        const { email, password, remember } = parsed.data;

        const ip = clientIp((req?.headers ?? {}) as Record<string, string>);
        const [byIp, byEmail] = await Promise.all([
          rateLimit(`login:ip:${ip}`, 30, 15 * 60),
          rateLimit(`login:email:${email}`, 8, 15 * 60),
        ]);
        if (!byIp.allowed || !byEmail.allowed) throw new Error(AUTH_ERRORS.RATE_LIMITED);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await burnPasswordCheck(password);
          throw new Error(AUTH_ERRORS.NO_ACCOUNT);
        }
        if (!user.passwordHash) {
          await burnPasswordCheck(password);
          throw new Error(AUTH_ERRORS.OAUTH_ONLY);
        }
        if (!(await verifyPassword(password, user.passwordHash))) {
          throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        await resetRateLimit(`login:email:${email}`);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          onboarded: user.onboarded,
          remember,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Our schema requires an email (also needed for account recovery).
      if (account?.provider === "facebook" && !user.email) return "/login?error=EmailRequired";
      return true;
    },

    async jwt({ token, user, trigger }) {
      // Past the remember-me window: drop the identity so every consumer sees a guest.
      if (!user && token.sessionExpiresAt && Date.now() > token.sessionExpiresAt) {
        return { sessionExpiresAt: token.sessionExpiresAt };
      }
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
        token.onboarded = user.onboarded ?? false;
        const lifetime = user.remember === false ? SESSION_SHORT_SECONDS : SESSION_REMEMBER_SECONDS;
        token.sessionExpiresAt = Date.now() + lifetime * 1000;
      }

      // Refresh mutable fields when the client calls `update()` (e.g. after onboarding).
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, image: true, role: true, onboarded: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.picture = fresh.image;
          token.role = fresh.role;
          token.onboarded = fresh.onboarded;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role ?? "USER";
        session.user.onboarded = token.onboarded ?? false;
      }
      if (token.sessionExpiresAt) session.expires = new Date(token.sessionExpiresAt).toISOString();
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => undefined);
      }
    },
    async createUser({ user }) {
      // OAuth users arrive with a provider-verified email.
      if (user.id && user.email) {
        await prisma.user
          .update({ where: { id: user.id }, data: { emailVerified: new Date() } })
          .catch(() => undefined);
      }
    },
  },
};

/** Server-side session helper. Treats sessions past their remember-me expiry as signed out. */
export async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.expires && new Date(session.expires).getTime() < Date.now()) return null;
  return session;
}
