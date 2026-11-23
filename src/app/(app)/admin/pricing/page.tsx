import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ensurePlanRows } from "@/lib/plans";
import { PageHeader } from "@/components/admin/kit";
import { PricingEditor } from "@/components/admin/pricing-editor";

export const metadata: Metadata = { title: "Admin · Pricing" };
export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await ensurePlanRows();
  const rows = await prisma.planConfig.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader
        title="Pricing"
        description="Plan prices and features shown on the Pricing page. Premium/Family unlock Premium songs, albums and podcasts."
      />
      <PricingEditor
        initial={rows.map((r) => ({
          plan: r.plan,
          name: r.name,
          tagline: r.tagline,
          priceInr: r.priceInr,
          priceUsd: r.priceUsd,
          features: r.features,
          highlighted: r.highlighted,
          cta: r.cta,
        }))}
      />
    </>
  );
}
