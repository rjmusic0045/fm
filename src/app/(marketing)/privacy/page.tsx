import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="20 November 2026"
      sections={[
        {
          heading: "What we collect",
          body: "Account details you provide (name, email, profile picture from Facebook if you connect it), your listening history, playlists and favourites, and billing status from our payment provider.",
        },
        {
          heading: "How we use it",
          body: "To run your account, personalise recommendations, process payments and keep the service secure. We never sell your personal data.",
        },
        {
          heading: "Payments",
          body: "Card details are handled entirely by Stripe. Lumen FM never stores your full card number.",
        },
        {
          heading: "Your choices",
          body: "You can edit your profile, disconnect Facebook, export your data or permanently delete your account from Settings at any time.",
        },
        {
          heading: "Contact",
          body: "Questions about privacy? Reach our team through the Help section in your account settings.",
        },
      ]}
    />
  );
}
