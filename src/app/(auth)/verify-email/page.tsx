import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { LampScene } from "@/components/auth/lamp-scene";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { consumeVerificationToken } from "@/lib/verification";

export const metadata: Metadata = { title: "Verify email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const email = typeof searchParams.token === "string" ? await consumeVerificationToken(searchParams.token) : null;

  return (
    <LampScene title="Verify your email" initialLit>
      <AuthCard>
        <div className="text-center">
          {email ? (
            <>
              <CheckCircle2 className="mx-auto size-12 text-emerald-400" aria-hidden />
              <h2 className="mt-4 text-2xl font-semibold">Email verified</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="text-foreground">{email}</span> is confirmed. Thanks!
              </p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href="/music">Start listening</Link>
              </Button>
            </>
          ) : (
            <>
              <XCircle className="mx-auto size-12 text-red-400" aria-hidden />
              <h2 className="mt-4 text-2xl font-semibold">Link expired</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This verification link is invalid, expired or already used. Sign in and request a new one from Settings.
              </p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href="/settings">Go to Settings</Link>
              </Button>
            </>
          )}
        </div>
      </AuthCard>
    </LampScene>
  );
}
