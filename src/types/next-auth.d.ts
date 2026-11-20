import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      onboarded: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    onboarded?: boolean;
    /** Credentials sign-in only: "Remember me" choice. */
    remember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    onboarded?: boolean;
    /** Epoch ms after which this session is no longer accepted (remember-me aware). */
    sessionExpiresAt?: number;
  }
}
