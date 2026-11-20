import type { Metadata } from "next";
import { LampScene } from "@/components/auth/lamp-scene";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage({ searchParams }: { searchParams: { email?: string } }) {
  return (
    <LampScene title="Reset your Lumen FM password" initialLit>
      <ForgotPasswordForm initialEmail={searchParams.email ?? ""} />
    </LampScene>
  );
}
