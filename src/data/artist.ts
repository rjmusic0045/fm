/**
 * Demo artist profile (fictional data) for the /artist screen.
 * Cover images: picsum.photos seeded photos (stable per seed, demo only).
 * Audio: royalty-free SoundHelix examples, same as the main catalog.
 */
import type { Palette } from "@/data/catalog";

const helix = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
export const pic = (seed: string, w = 400, h = w) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export interface ArtistTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  /** seconds */
  duration: number;
  src: string;
  image: string;
  palette: Palette;
  plays: number;
  likes: number;
  reposts: number;
  comments: number;
  /** ISO date */
  postedAt: string;
  /** Present when this track appears as a repost on the profile. */
  repostedFrom?: string;
}

export interface Release {
  id: string;
  title: string;
  kind: "Album" | "EP" | "Playlist";
  year: number;
  trackIds: string[];
  image: string;
}

export interface RelatedArtist {
  id: string;
  name: string;
  city: string;
  followers: number;
  tracks: number;
  image: string;
}

export const artist = {
  handle: "rj-kiran-chennai",
  name: "RJ Kiran",
  realName: "Kiran Raghavan",
  city: "Chennai",
  country: "India",
  verified: true,
  pro: true,
  followers: 48210,
  following: 312,
  tracksCount: 12,
  bio: "Radio jockey, storyteller and late-night playlist curator from Chennai. Every week: fresh Tamil indie, retro gold and the stories behind the songs. Bookings and collabs via the Lumen inbox.",
  links: [
    { label: "Instagram", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "Website", href: "#" },
  ],
  avatar: pic("rj-kiran-avatar", 400, 400),
  banner: pic("chennai-night-banner", 1600, 520),
} as const;

export const artistTracks: ArtistTrack[] = [
  { id: "marina-midnight", title: "Marina Midnight", artist: "RJ Kiran", genre: "Lo-fi", duration: 372, src: helix(1), image: pic("marina-midnight"), palette: ["#7C3AED", "#EC4899"], plays: 182400, likes: 9120, reposts: 1204, comments: 386, postedAt: "2026-11-14" },
  { id: "filter-coffee-sessions", title: "Filter Coffee Sessions #12", artist: "RJ Kiran", genre: "Talk & Music", duration: 425, src: helix(2), image: pic("filter-coffee"), palette: ["#F59E0B", "#B45309"], plays: 96300, likes: 4410, reposts: 512, comments: 221, postedAt: "2026-11-08" },
  { id: "monsoon-letters", title: "Monsoon Letters", artist: "RJ Kiran ft. Meera V", genre: "Indie Pop", duration: 344, src: helix(3), image: pic("monsoon-letters"), palette: ["#0EA5E9", "#7C3AED"], plays: 241800, likes: 15230, reposts: 2108, comments: 704, postedAt: "2026-10-29" },
  { id: "auto-rickshaw-groove", title: "Auto Rickshaw Groove", artist: "RJ Kiran", genre: "Electronic", duration: 302, src: helix(4), image: pic("auto-groove"), palette: ["#22C55E", "#0EA5E9"], plays: 64250, likes: 2980, reposts: 311, comments: 97, postedAt: "2026-10-17" },
  { id: "retro-rewind-90s", title: "Retro Rewind: 90s Special", artist: "RJ Kiran", genre: "Retro Mix", duration: 353, src: helix(5), image: pic("retro-rewind"), palette: ["#EC4899", "#F59E0B"], plays: 318900, likes: 21040, reposts: 3320, comments: 1182, postedAt: "2026-10-03" },
  { id: "besant-nagar-sunrise", title: "Besant Nagar Sunrise", artist: "RJ Kiran", genre: "Ambient", duration: 279, src: helix(6), image: pic("sunrise-beach"), palette: ["#F97316", "#DB2777"], plays: 41200, likes: 1870, reposts: 166, comments: 54, postedAt: "2026-09-21" },
  { id: "city-lights-mylapore", title: "City Lights, Mylapore", artist: "RJ Kiran", genre: "Chill Hop", duration: 420, src: helix(7), image: pic("city-lights"), palette: ["#6366F1", "#06B6D4"], plays: 77900, likes: 3650, reposts: 402, comments: 133, postedAt: "2026-09-02" },
  { id: "late-night-dedications", title: "Late Night Dedications", artist: "RJ Kiran", genre: "Talk & Music", duration: 325, src: helix(8), image: pic("late-night-radio"), palette: ["#DB2777", "#7C3AED"], plays: 128700, likes: 6720, reposts: 845, comments: 512, postedAt: "2026-08-15" },
];

export const repostedTracks: ArtistTrack[] = [
  { id: "velvet-skies", title: "Velvet Skies", artist: "Mira Vale", genre: "R&B", duration: 298, src: helix(9), image: pic("velvet-skies"), palette: ["#7C3AED", "#06B6D4"], plays: 512300, likes: 28400, reposts: 4120, comments: 960, postedAt: "2026-11-11", repostedFrom: "Mira Vale" },
  { id: "kolam-beats", title: "Kolam Beats", artist: "Arjun Sol", genre: "Hip-Hop", duration: 311, src: helix(10), image: pic("kolam-beats"), palette: ["#EF4444", "#F59E0B"], plays: 206800, likes: 11900, reposts: 1630, comments: 418, postedAt: "2026-10-22", repostedFrom: "Arjun Sol" },
  { id: "harbour-lights", title: "Harbour Lights", artist: "Orbit Club", genre: "Deep House", duration: 334, src: helix(11), image: pic("harbour-lights"), palette: ["#0EA5E9", "#22C55E"], plays: 98400, likes: 4300, reposts: 570, comments: 120, postedAt: "2026-09-30", repostedFrom: "Orbit Club" },
];

export const releases: Release[] = [
  { id: "chennai-after-dark", title: "Chennai After Dark", kind: "Album", year: 2026, trackIds: ["marina-midnight", "city-lights-mylapore", "auto-rickshaw-groove", "besant-nagar-sunrise"], image: pic("chennai-after-dark") },
  { id: "monsoon-tapes", title: "Monsoon Tapes", kind: "EP", year: 2025, trackIds: ["monsoon-letters", "besant-nagar-sunrise"], image: pic("monsoon-tapes") },
  { id: "on-air-vol-1", title: "On Air, Vol. 1", kind: "Album", year: 2025, trackIds: ["filter-coffee-sessions", "late-night-dedications", "retro-rewind-90s"], image: pic("on-air-vol1") },
];

export const playlists: Release[] = [
  { id: "sunday-drive", title: "Sunday Drive to ECR", kind: "Playlist", year: 2026, trackIds: ["marina-midnight", "velvet-skies", "monsoon-letters", "harbour-lights"], image: pic("sunday-drive") },
  { id: "study-with-kiran", title: "Study With Kiran", kind: "Playlist", year: 2026, trackIds: ["besant-nagar-sunrise", "city-lights-mylapore", "harbour-lights"], image: pic("study-lofi") },
  { id: "retro-gold", title: "Retro Gold Hour", kind: "Playlist", year: 2025, trackIds: ["retro-rewind-90s", "kolam-beats", "late-night-dedications"], image: pic("retro-gold") },
  { id: "rainy-day", title: "Rainy Day Chai", kind: "Playlist", year: 2025, trackIds: ["monsoon-letters", "filter-coffee-sessions", "velvet-skies"], image: pic("rainy-chai") },
];

export const relatedArtists: RelatedArtist[] = [
  { id: "mira-vale", name: "Mira Vale", city: "Bengaluru", followers: 128400, tracks: 34, image: pic("mira-vale-avatar", 200, 200) },
  { id: "arjun-sol", name: "Arjun Sol", city: "Hyderabad", followers: 86200, tracks: 21, image: pic("arjun-sol-avatar", 200, 200) },
  { id: "orbit-club", name: "Orbit Club", city: "Mumbai", followers: 54900, tracks: 47, image: pic("orbit-club-avatar", 200, 200) },
];

export const allArtistTracks = [...artistTracks, ...repostedTracks];
export const findTracks = (ids: string[]) =>
  ids.map((id) => allArtistTracks.find((t) => t.id === id)).filter((t): t is ArtistTrack => Boolean(t));
