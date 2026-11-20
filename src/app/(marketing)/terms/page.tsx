import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="20 November 2026"
      sections={[
        {
          heading: "1. Using Lumen FM",
          body: "Lumen FM provides streaming access to live radio stations and recorded music for personal, non-commercial use. You must be at least 13 years old to create an account.",
        },
        {
          heading: "2. Your account",
          body: "You are responsible for keeping your login credentials secure and for all activity under your account. Tell us immediately if you suspect unauthorised access.",
        },
        {
          heading: "3. Subscriptions and billing",
          body: "Paid plans renew automatically each billing period until cancelled. You can cancel at any time from the billing page; access continues until the end of the current period.",
        },
        {
          heading: "4. Content",
          body: "All audio is licensed to Lumen FM or provided by broadcasters. You may not record, redistribute or circumvent any technical protection applied to the content.",
        },
        {
          heading: "5. Termination",
          body: "We may suspend accounts that violate these terms. You can delete your account at any time from Settings.",
        },
      ]}
    />
  );
}
