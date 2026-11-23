import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { GENRES, LANGUAGES } from "@/config/taxonomy";
import { getEntitlement } from "@/lib/entitlement";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80).optional(),
  favoriteGenres: z.array(z.enum(GENRES)).max(GENRES.length).optional(),
  preferredLanguages: z.array(z.enum(LANGUAGES)).max(LANGUAGES.length).optional(),
  audioQuality: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
  /** Marks onboarding as done. */
  completeOnboarding: z.literal(true).optional(),
});

/** Current user's profile and preferences. */
export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "UNAUTHENTICATED", "Sign in first.");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, emailVerified: true, favoriteGenres: true, preferredLanguages: true, audioQuality: true, onboarded: true },
  });
  if (!user) return jsonError(404, "NOT_FOUND", "Account not found.");
  return jsonOk({ user });
}

/** Updates the signed-in user's profile/preferences (any subset of fields). */
export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const session = await getSession();
  if (!session) return jsonError(401, "UNAUTHENTICATED", "Sign in first.");

  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check your choices.");
  const { completeOnboarding, ...data } = parsed.data;

  // HIGH quality is a Premium perk: enforced here, not just in the UI.
  if (data.audioQuality === "HIGH" && !(await getEntitlement(session.user.id, session.user.role)).canPlayPremium) {
    return jsonError(403, "PREMIUM_REQUIRED", "High quality audio needs an active Premium plan.");
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { ...data, ...(completeOnboarding ? { onboarded: true } : {}) },
    select: { name: true, favoriteGenres: true, preferredLanguages: true, audioQuality: true, onboarded: true },
  });
  return jsonOk({ user });
}
