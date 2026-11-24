import "server-only";
import { z } from "zod";
import { VOICE_CATEGORY_IDS, voiceCategoryById } from "@/config/voices";
import { accessSchema, boolField, field, isFieldError, languageField, publishFields, textField } from "@/lib/admin-forms";

const baseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(4000).default(""),
  category: z.enum(VOICE_CATEGORY_IDS, { errorMap: () => ({ message: "Choose a category." }) }),
  topic: z.string().trim().min(1, "Choose a topic."),
  duration: z.coerce.number().int().min(0).max(24 * 60 * 60).default(0),
  access: accessSchema.default("FREE"),
});

type Existing = {
  title: string;
  description: string;
  category: string;
  topic: string;
  duration: number;
  access: "FREE" | "PREMIUM";
} | null;

/**
 * Parses a People & Voices admin form (create, or PATCH over `existing`).
 * Returns data ready for Prisma, or { error }.
 */
export function parseVoiceForm(form: FormData, existing: Existing = null) {
  const parsed = baseSchema.safeParse({
    title: field(form, "title") ?? existing?.title,
    description: field(form, "description") ?? existing?.description ?? "",
    category: field(form, "category") || existing?.category,
    topic: field(form, "topic") || existing?.topic,
    duration: field(form, "duration") || existing?.duration || 0,
    access: field(form, "access") || existing?.access || "FREE",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." } as const;

  const cat = voiceCategoryById(parsed.data.category)!;
  if (!cat.topics.includes(parsed.data.topic)) return { error: `"${parsed.data.topic}" isn't a topic of ${cat.name}.` } as const;

  const language = languageField(form);
  const state = textField(form, "state");
  const district = textField(form, "district");
  const village = textField(form, "village");
  const speakerName = textField(form, "speakerName", 120);
  const pub = publishFields(form);
  for (const v of [language, state, district, village, speakerName, pub]) if (isFieldError(v)) return { error: v.error } as const;

  return {
    data: {
      ...parsed.data,
      ...(language !== undefined ? { language: language as string | null } : {}),
      ...(state !== undefined ? { state: state as string | null } : {}),
      ...(district !== undefined ? { district: district as string | null } : {}),
      ...(village !== undefined ? { village: village as string | null } : {}),
      ...(speakerName !== undefined ? { speakerName: (speakerName as string | null) ?? "" } : {}),
      ...(boolField(form, "anonymous") !== undefined ? { anonymous: boolField(form, "anonymous")! } : {}),
      ...(boolField(form, "featured") !== undefined ? { featured: boolField(form, "featured")! } : {}),
      ...((pub as { isActive: boolean; publishAt: Date | null } | undefined) ?? {}),
    },
  } as const;
}
