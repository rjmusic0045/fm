import "server-only";
import type { Plan as PlanEnum } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { plans as defaultPlans, type Plan } from "@/config/plans";

/**
 * Subscription plans for the Pricing page and admin. Stored in PlanConfig so
 * admins can edit prices; seeded from config/plans.ts on first use.
 */
export async function getPlans(): Promise<Plan[]> {
  try {
    let rows = await prisma.planConfig.findMany({ orderBy: { sortOrder: "asc" } });
    if (rows.length === 0) {
      await ensurePlanRows();
      rows = await prisma.planConfig.findMany({ orderBy: { sortOrder: "asc" } });
    }
    return rows.map((r) => ({
      id: r.plan,
      name: r.name,
      tagline: r.tagline,
      price: { inr: r.priceInr, usd: r.priceUsd },
      features: r.features,
      highlighted: r.highlighted,
      cta: r.cta,
    }));
  } catch (err) {
    // Database down: the Pricing page still renders with the built-in prices.
    console.error("[plans] falling back to defaults", err);
    return defaultPlans;
  }
}

/** Creates any missing PlanConfig rows from the built-in defaults (never overwrites edits). */
export async function ensurePlanRows() {
  await Promise.all(
    defaultPlans.map((p, i) =>
      prisma.planConfig.upsert({
        where: { plan: p.id as PlanEnum },
        create: {
          plan: p.id as PlanEnum,
          name: p.name,
          tagline: p.tagline,
          priceInr: p.price.inr,
          priceUsd: p.price.usd,
          features: p.features,
          highlighted: Boolean(p.highlighted),
          cta: p.cta,
          sortOrder: i,
        },
        update: {},
      }),
    ),
  );
}
