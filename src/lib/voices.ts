import "server-only";
import type { Prisma, VoiceStory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { released } from "@/lib/release";
import type { VoiceDTO } from "@/lib/voice-dto";
import type { VoiceCategoryId } from "@/config/voices";

/** Public shape. Privacy: anonymous stories never expose the speaker or location. */
export function toVoiceDTO(s: VoiceStory): VoiceDTO {
  const place = s.anonymous ? null : [s.village, s.district, s.state].filter(Boolean).join(", ") || null;
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    category: s.category as VoiceCategoryId,
    topic: s.topic,
    language: s.language,
    place,
    speaker: s.anonymous ? "Anonymous" : s.speakerName || "Lumen listener",
    anonymous: s.anonymous,
    audioUrl: s.audioUrl,
    duration: s.duration,
    coverUrl: s.coverUrl,
    palette: [s.coverFrom, s.coverTo],
    premium: s.access === "PREMIUM",
    featured: s.featured,
    plays: s.plays,
    publishedAt: (s.publishAt ?? s.createdAt).toISOString(),
  };
}

export interface VoiceFilters {
  category?: VoiceCategoryId;
  topic?: string;
  language?: string;
  state?: string;
  district?: string;
  village?: string;
  featured?: boolean;
  q?: string;
}

const contains = (v?: string) => (v?.trim() ? { contains: v.trim(), mode: "insensitive" as const } : undefined);

/** Published (released, active) stories matching the filters, newest first. */
export async function listVoices(f: VoiceFilters = {}, take = 60): Promise<VoiceDTO[]> {
  const where: Prisma.VoiceStoryWhereInput = {
    isActive: true,
    ...released(),
    ...(f.category ? { category: f.category } : {}),
    ...(f.topic ? { topic: f.topic } : {}),
    ...(f.language ? { language: f.language } : {}),
    ...(f.featured ? { featured: true } : {}),
    // Location filters never match anonymous stories (their location is private).
    ...(f.state || f.district || f.village
      ? { anonymous: false, state: contains(f.state), district: contains(f.district), village: contains(f.village) }
      : {}),
    ...(f.q?.trim()
      ? {
          AND: [
            {
              OR: [
                { title: { contains: f.q.trim(), mode: "insensitive" } },
                { description: { contains: f.q.trim(), mode: "insensitive" } },
                { topic: { contains: f.q.trim(), mode: "insensitive" } },
              ],
            },
          ],
        }
      : {}),
  };
  // Prisma rejects `undefined` inside the location object less gracefully on Mongo: drop empties.
  for (const k of ["state", "district", "village"] as const) if (where[k] === undefined) delete where[k];
  const rows = await prisma.voiceStory.findMany({ where, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take });
  return rows.map(toVoiceDTO);
}

export async function getVoice(slug: string): Promise<VoiceDTO | null> {
  const s = await prisma.voiceStory.findFirst({ where: { slug, isActive: true, ...released() } });
  return s ? toVoiceDTO(s) : null;
}

/** Published story count per category (for the landing grid). */
export async function voiceCounts(): Promise<Record<string, number>> {
  const rows = await prisma.voiceStory.groupBy({ by: ["category"], where: { isActive: true, ...released() }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.category, r._count._all]));
}
