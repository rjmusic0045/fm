// People & Voices: categories and their topics (single source of truth for
// admin forms, filters and public pages). `id` matches the VoiceCategory enum.

export type VoiceCategoryId =
  | "RANDOM_TALKS"
  | "UNKNOWN_TALKS"
  | "HEART_TALKS"
  | "YOUTH_VOICE"
  | "BUSINESS_IDEAS"
  | "VILLAGE_VOICE"
  | "LOCAL_TALENT"
  | "STRUGGLES_OPPORTUNITIES";

export interface VoiceCategory {
  id: VoiceCategoryId;
  /** URL segment: /voices/<slug> */
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** lucide icon name, mapped in the UI */
  icon: "Mic" | "Sparkles" | "Heart" | "GraduationCap" | "Lightbulb" | "Trees" | "Music" | "Mountain";
  palette: readonly [string, string];
  topics: readonly string[];
  /** Personal/emotional content: anonymous publishing is the default suggestion. */
  sensitive?: boolean;
  /** Location filters are prominent for this category. */
  locationFirst?: boolean;
}

export const VOICE_SECTION = {
  name: "People & Voices",
  tagline: "Stories That Deserve to Be Heard",
  description:
    "Conversations with remarkable people, stories from ordinary heroes, voices from villages and campuses, and the talent next door.",
} as const;

export const VOICE_CATEGORIES: readonly VoiceCategory[] = [
  {
    id: "RANDOM_TALKS",
    slug: "random-talks",
    name: "Random Talks",
    tagline: "Conversations with people who shape our world",
    description: "Interviews with celebrities, sports stars, business leaders, artists and people making a difference.",
    icon: "Mic",
    palette: ["#4F46E5", "#7C3AED"],
    topics: [
      "Celebrities",
      "Cricketers & sports personalities",
      "Business leaders",
      "Entrepreneurs",
      "Artists & musicians",
      "Emerging talent",
      "People making a difference",
    ],
  },
  {
    id: "UNKNOWN_TALKS",
    slug: "unknown-talks",
    name: "Unknown Talks",
    tagline: "Ordinary people, extraordinary stories",
    description: "Unsung heroes and unknown achievers share journeys that deserve public attention.",
    icon: "Sparkles",
    palette: ["#0EA5E9", "#4F46E5"],
    topics: [
      "Unknown achievers",
      "Unsung heroes",
      "Inspiring personal journeys",
      "Unique experiences",
      "Overcoming challenges",
      "Stories that deserve attention",
    ],
  },
  {
    id: "HEART_TALKS",
    slug: "heart-talks",
    name: "Heart Talks",
    tagline: "Human emotions, told with care",
    description: "Relationships, family, friendship and the lessons life teaches us, shared respectfully and privately.",
    icon: "Heart",
    palette: ["#EC4899", "#F43F5E"],
    sensitive: true,
    topics: ["Relationships", "Family", "Friendship", "Personal struggles", "Emotional experiences", "Life lessons", "Personal growth"],
  },
  {
    id: "YOUTH_VOICE",
    slug: "youth-voice",
    name: "Youth Voice",
    tagline: "Young people, their own words",
    description: "College life, careers, technology and AI, youth entrepreneurship and opinions on the issues that matter.",
    icon: "GraduationCap",
    palette: ["#22C55E", "#0EA5E9"],
    topics: [
      "College life",
      "Career confusion",
      "Education",
      "Technology & AI",
      "Youth entrepreneurship",
      "Social issues",
      "Youth opinions",
      "Student achievements",
    ],
  },
  {
    id: "BUSINESS_IDEAS",
    slug: "business-ideas",
    name: "Business Ideas",
    tagline: "Ideas, ventures and the people behind them",
    description: "Startup and small-business ideas, village opportunities, success stories and expert guidance.",
    icon: "Lightbulb",
    palette: ["#F59E0B", "#EA580C"],
    topics: [
      "Startup ideas",
      "Small business ideas",
      "Village business opportunities",
      "New entrepreneurs",
      "Business success stories",
      "Business challenges",
      "Expert discussions",
      "Mentorship & guidance",
    ],
  },
  {
    id: "VILLAGE_VOICE",
    slug: "village-voice",
    name: "Village Voice",
    tagline: "Rural India, in its own voice",
    description: "Village stories, farmers, local culture, rural achievements and the problems and solutions that shape them.",
    icon: "Trees",
    palette: ["#16A34A", "#65A30D"],
    locationFirst: true,
    topics: [
      "Village stories",
      "Farmers & agriculture",
      "Local culture & traditions",
      "Rural achievements",
      "Village development",
      "Local problems & solutions",
      "Education & employment",
      "Local personalities",
    ],
  },
  {
    id: "LOCAL_TALENT",
    slug: "local-talent",
    name: "Local Talent",
    tagline: "The talent next door",
    description: "Singers, folk artists, rappers, instrumentalists and emerging performers from every corner.",
    icon: "Music",
    palette: ["#DB2777", "#7C3AED"],
    topics: [
      "Singing",
      "Independent singers",
      "Children's singing",
      "Folk music",
      "Rap",
      "Instrumental music",
      "Emerging artists",
      "Unique performances",
      "Local cultural talent",
    ],
  },
  {
    id: "STRUGGLES_OPPORTUNITIES",
    slug: "struggles-opportunities",
    name: "Struggles & Opportunities",
    tagline: "Real setbacks, real comebacks",
    description: "Career and financial struggles, success after failure, and the opportunities that change lives.",
    icon: "Mountain",
    palette: ["#475569", "#4F46E5"],
    topics: [
      "Career challenges",
      "Job search experiences",
      "Financial difficulties",
      "Entrepreneurial challenges",
      "Personal setbacks",
      "Success after failure",
      "Opportunity spotlight",
    ],
  },
];

export const voiceCategoryById = (id: string) => VOICE_CATEGORIES.find((c) => c.id === id);
export const voiceCategoryBySlug = (slug: string) => VOICE_CATEGORIES.find((c) => c.slug === slug);
export const VOICE_CATEGORY_IDS = VOICE_CATEGORIES.map((c) => c.id) as [VoiceCategoryId, ...VoiceCategoryId[]];

// ---------------------------------------------------------------------------
// Submit Your Voice
// ---------------------------------------------------------------------------

export type SubmissionTypeId =
  | "PERSONAL_STORY"
  | "OPINION"
  | "SINGING"
  | "BUSINESS_IDEA"
  | "VILLAGE_STORY"
  | "LIFE_EXPERIENCE"
  | "QUESTION"
  | "YOUTH_DISCUSSION"
  | "OTHER";

/** Submission types with the category they usually belong to (pre-selected in the form). */
export const SUBMISSION_TYPES: readonly { id: SubmissionTypeId; label: string; suggests: VoiceCategoryId }[] = [
  { id: "PERSONAL_STORY", label: "Personal story", suggests: "UNKNOWN_TALKS" },
  { id: "OPINION", label: "Opinion", suggests: "YOUTH_VOICE" },
  { id: "SINGING", label: "Singing / music performance", suggests: "LOCAL_TALENT" },
  { id: "BUSINESS_IDEA", label: "Business idea", suggests: "BUSINESS_IDEAS" },
  { id: "VILLAGE_STORY", label: "Village story", suggests: "VILLAGE_VOICE" },
  { id: "LIFE_EXPERIENCE", label: "Life experience", suggests: "HEART_TALKS" },
  { id: "QUESTION", label: "Question", suggests: "YOUTH_VOICE" },
  { id: "YOUTH_DISCUSSION", label: "Youth discussion", suggests: "YOUTH_VOICE" },
  { id: "OTHER", label: "Other creative content", suggests: "RANDOM_TALKS" },
];
export const SUBMISSION_TYPE_IDS = SUBMISSION_TYPES.map((t) => t.id) as [SubmissionTypeId, ...SubmissionTypeId[]];
export const submissionTypeLabel = (id: string) => SUBMISSION_TYPES.find((t) => t.id === id)?.label ?? id;

/** Longest recording/upload we accept from listeners (seconds). */
export const MAX_SUBMISSION_SECONDS = 15 * 60;
