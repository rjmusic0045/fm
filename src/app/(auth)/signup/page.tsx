import type { Metadata } from "next";
import { LampScene } from "@/components/auth/lamp-scene";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Lumen FM account.",
};

export default function SignupPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = typeof searchParams.email === "string" && searchParams.email.length <= 254 ? searchParams.email : "";
  return (
    <LampScene title="Create a Lumen FM account" initialLit>
      <SignupForm initialEmail={email} />
    </LampScene>
  );
}
