import "server-only";
import { z } from "zod";
import { MAX_SUBMISSION_SECONDS, SUBMISSION_TYPE_IDS, VOICE_CATEGORY_IDS, voiceCategoryById } from "@/config/voices";
import { boolField, field, isFieldError, languageField, textField } from "@/lib/admin-forms";

const schema = z.object({
  type: z.enum(SUBMISSION_TYPE_IDS, { errorMap: () => ({ message: "Choose what you're sharing." }) }),
  title: z.string().trim().min(3, "Give it a title (3+ characters).").max(160),
  description: z.string().trim().max(2000).default(""),
  category: z.enum(VOICE_CATEGORY_IDS, { errorMap: () => ({ message: "Choose a category." }) }),
  topic: z.string().trim().min(1, "Choose a topic."),
  duration: z.coerce.number().int().min(0).max(MAX_SUBMISSION_SECONDS, `Keep it under ${MAX_SUBMISSION_SECONDS / 60} minutes.`).default(0),
});

type Existing = { type: string; title: string; description: string; category: string; topic: string; duration: number } | null;

/**
 * Validates a listener's Submit Your Voice form (create, or edit over `existing`).
 * Consent (terms + ownership/permission) is required on every create and resubmit.
 */
export function parseSubmissionForm(form: FormData, existing: Existing = null) {
  const parsed = schema.safeParse({
    type: field(form, "type") || existing?.type,
    title: field(form, "title") ?? existing?.title,
    description: field(form, "description") ?? existing?.description ?? "",
    category: field(form, "category") || existing?.category,
    topic: field(form, "topic") || existing?.topic,
    duration: field(form, "duration") || existing?.duration || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." } as const;

  const cat = voiceCategoryById(parsed.data.category)!;
  if (!cat.topics.includes(parsed.data.topic)) return { error: `Choose a topic from ${cat.name}.` } as const;

  if (boolField(form, "acceptTerms") !== true) return { error: "Please accept the content terms." } as const;
  if (boolField(form, "confirmOwnership") !== true) {
    return { error: "Please confirm this is your own content or that you have permission to share it." } as const;
  }

  const language = languageField(form);
  const state = textField(form, "state");
  const district = textField(form, "district");
  const village = textField(form, "village");
  const displayName = textField(form, "displayName", 80);
  for (const v of [language, state, district, village, displayName]) if (isFieldError(v)) return { error: v.error } as const;

  return {
    data: {
      ...parsed.data,
      ...(language !== undefined ? { language: language as string | null } : {}),
      ...(state !== undefined ? { state: state as string | null } : {}),
      ...(district !== undefined ? { district: district as string | null } : {}),
      ...(village !== undefined ? { village: village as string | null } : {}),
      ...(displayName !== undefined ? { displayName: (displayName as string | null) ?? "" } : {}),
      anonymous: boolField(form, "anonymous") === true,
      recorded: boolField(form, "recorded") === true,
      consentAt: new Date(),
    },
  } as const;
}
