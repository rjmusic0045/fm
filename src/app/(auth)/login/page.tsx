import type { Metadata } from "next";
import { LampScene } from "@/components/auth/lamp-scene";
import { LoginForm } from "@/components/auth/login-form";
import { facebookEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Pull the cord, turn on the light and sign in to Lumen FM.",
};

/** Maps auth error codes in the URL (e.g. from OAuth redirects) to friendly copy. */
const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already registered with a password. Sign in with email instead.",
  AccessDenied: "Access was denied. Please try again.",
  CredentialsSignin: "Incorrect email or password.",
  SessionRequired: "Please sign in to continue.",
  EmailRequired: "Facebook didn't share an email address. Allow email access or sign up with email instead.",
  OAuthSignin: "Couldn't start Facebook sign-in. Please try again.",
  OAuthCallback: "Facebook sign-in was interrupted. Please try again.",
  Default: "Couldn't sign you in. Please try again.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const callbackUrl =
    searchParams.callbackUrl?.startsWith("/") && !searchParams.callbackUrl.startsWith("//")
      ? searchParams.callbackUrl
      : undefined;
  const initialError = searchParams.error ? (errorMessages[searchParams.error] ?? errorMessages.Default) : undefined;

  return (
    <LampScene title="Sign in to Lumen FM" initialLit={!!initialError}>
      <LoginForm callbackUrl={callbackUrl} initialError={initialError} facebookEnabled={facebookEnabled} />
    </LampScene>
  );
}
