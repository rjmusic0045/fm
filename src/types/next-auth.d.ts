import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      onboarded: boolean;
    } & DefaultSession["user"];
    /** Set when this device was signed out because the account logged in elsewhere. */
    revoked?: boolean;
    /** Epoch ms of this login (used to show login-time notices once). */
    loginAt?: number;
  }

  interface User {
    role?: Role;
    onboarded?: boolean;
    /** Credentials sign-in only: "Remember me" choice. */
    remember?: boolean;
    /** Device session id issued at credentials sign-in. */
    sid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    onboarded?: boolean;
    /** Epoch ms after which this session is no longer accepted (remember-me aware). */
    sessionExpiresAt?: number;
    /** Device session id; must equal User.activeSessionId to stay signed in. */
    sid?: string;
    sidCheckedAt?: number;
    loginAt?: number;
    revoked?: boolean;
  }
}
