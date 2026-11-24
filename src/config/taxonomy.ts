// Choices offered at onboarding and in settings (stored as plain strings on the user).

export const GENRES = [
  "Pop",
  "Indie",
  "Hip-Hop",
  "Electronic",
  "Lo-fi",
  "Rock",
  "Jazz",
  "Classical",
  "Carnatic",
  "Devotional",
  "Folk",
  "R&B",
  "Ambient",
  "Film Music",
  "Retro",
  "Talk & Podcasts",
] as const;

export const LANGUAGES = [
  "Tamil",
  "Telugu",
  "Hindi",
  "Malayalam",
  "Kannada",
  "English",
  "Bengali",
  "Marathi",
  "Punjabi",
  "Gujarati",
  "Instrumental",
] as const;

export const AUDIO_QUALITIES = [
  { id: "LOW", label: "Data saver", hint: "64 kbps" },
  { id: "NORMAL", label: "Standard", hint: "128 kbps" },
  { id: "HIGH", label: "High", hint: "320 kbps · Premium" },
] as const;
