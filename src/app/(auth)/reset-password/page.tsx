import type { Metadata } from "next";
import { LampScene } from "@/components/auth/lamp-scene";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <LampScene title="Choose a new Lumen FM password" initialLit>
      <ResetPasswordForm token={searchParams.token ?? null} />
    </LampScene>
  );
}
