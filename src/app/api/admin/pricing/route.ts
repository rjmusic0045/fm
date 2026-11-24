import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { ensurePlanRows } from "@/lib/plans";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

const planSchema = z.object({
  plan: z.enum(["FREE", "PREMIUM", "FAMILY"]),
  name: z.string().trim().min(1).max(40),
  tagline: z.string().trim().max(120).default(""),
  priceInr: z.number().min(0).max(100000),
  priceUsd: z.number().min(0).max(10000),
  features: z.array(z.string().trim().min(1).max(120)).max(12),
  highlighted: z.boolean().default(false),
  cta: z.string().trim().min(1).max(40),
});

// Admin: save plan prices and features. Body: { plans: PlanInput[] }
export async function PUT(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");

  const parsed = z.object({ plans: z.array(planSchema).min(1).max(3) }).safeParse(await readJson(req));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError(400, "INVALID_INPUT", issue ? `${issue.path.join(".")}: ${issue.message}` : "Check the plan fields.");
  }
  const free = parsed.data.plans.find((p) => p.plan === "FREE");
  if (free && (free.priceInr !== 0 || free.priceUsd !== 0)) {
    return jsonError(400, "INVALID_INPUT", "The Free plan must cost 0.");
  }

  await ensurePlanRows();
  await Promise.all(
    parsed.data.plans.map(({ plan, ...data }) => prisma.planConfig.update({ where: { plan }, data })),
  );
  revalidatePath("/"); // home page caches the Pricing section
  return jsonOk();
}
