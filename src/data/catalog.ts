// Static demo catalog used by the public landing page (and as seed data later).
// Audio: royalty-free SoundHelix examples (https://www.soundhelix.com), CC-licensed demo tracks.
// "Live" stations are simulated with looping long-form streams that start at a random offset.

export type Palette = readonly [from: string, to: string];

export interface Station {
  id: string;
  name: string;
  frequency: string;
  genre: string;
  city: string;
  listeners: number;
  streamUrl: string;
  palette: Palette;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  // seconds
  duration: number;
  src: string;
  palette: Palette;
}

const helix = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

export const stations: Station[] = [
  { id: "neon-nights", name: "Neon Nights", frequency: "98.3 FM", genre: "Synthwave", city: "Mumbai", listeners: 12480, streamUrl: helix(11), palette: ["#7C3AED", "#EC4899"] },
  { id: "chai-and-chill", name: "Chai & Chill", frequency: "91.1 FM", genre: "Lo-fi", city: "Bengaluru", listeners: 9312, streamUrl: helix(12), palette: ["#F59E0B", "#EC4899"] },
  { id: "pulse-city", name: "Pulse City", frequency: "104.8 FM", genre: "EDM", city: "Delhi", listeners: 15820, streamUrl: helix(13), palette: ["#06B6D4", "#7C3AED"] },
  { id: "velvet-jazz", name: "Velvet Jazz", frequency: "88.5 FM", genre: "Jazz", city: "Kolkata", listeners: 4210, streamUrl: helix(14), palette: ["#B45309", "#7C2D12"] },
  { id: "sunset-boulevard", name: "Sunset Blvd", frequency: "101.2 FM", genre: "Indie Pop", city: "Goa", listeners: 7640, streamUrl: helix(15), palette: ["#F97316", "#DB2777"] },
  { id: "deep-focus", name: "Deep Focus", frequency: "93.7 FM", genre: "Ambient", city: "Pune", listeners: 6025, streamUrl: helix(16), palette: ["#0EA5E9", "#22C55E"] },
  { id: "bassline", name: "Bassline", frequency: "106.4 FM", genre: "Hip-Hop", city: "Hyderabad", listeners: 11190, streamUrl: helix(9), palette: ["#EF4444", "#7C3AED"] },
  { id: "retro-wave", name: "Retro Rewind", frequency: "95.0 FM", genre: "80s & 90s", city: "Chennai", listeners: 5530, streamUrl: helix(10), palette: ["#EC4899", "#F59E0B"] },
];

export const songs: Song[] = [
  { id: "midnight-drive", title: "Midnight Drive", artist: "Nova Lights", album: "Afterglow", duration: 372, src: helix(1), palette: ["#7C3AED", "#EC4899"] },
  { id: "city-rain", title: "City Rain", artist: "Kavya & The Echoes", album: "Monsoon Tapes", duration: 425, src: helix(2), palette: ["#0EA5E9", "#7C3AED"] },
  { id: "golden-hour", title: "Golden Hour", artist: "Arjun Sol", album: "Daybreak", duration: 344, src: helix(3), palette: ["#F59E0B", "#EF4444"] },
  { id: "paper-planes", title: "Paper Planes", artist: "Lumen Collective", album: "Skyline", duration: 302, src: helix(4), palette: ["#22C55E", "#0EA5E9"] },
  { id: "neon-heart", title: "Neon Heart", artist: "Mira Vale", album: "Glow", duration: 353, src: helix(5), palette: ["#EC4899", "#F97316"] },
  { id: "satellite", title: "Satellite", artist: "Orbit Club", album: "Low Earth", duration: 279, src: helix(6), palette: ["#6366F1", "#06B6D4"] },
  { id: "slow-motion", title: "Slow Motion", artist: "Rhea Moon", album: "Velvet", duration: 420, src: helix(7), palette: ["#DB2777", "#7C3AED"] },
  { id: "static-dreams", title: "Static Dreams", artist: "The Frequencies", album: "Dial Tone", duration: 325, src: helix(8), palette: ["#F59E0B", "#7C3AED"] },
];

export const testimonials = [
  { name: "Ananya Rao", role: "Product designer, Bengaluru", quote: "The HD streams are crisp and the UI is gorgeous. Lumen replaced three apps on my phone.", rating: 5 },
  { name: "Rahul Mehta", role: "Night-shift engineer, Pune", quote: "Deep Focus at 3am is my ritual. Zero ads on Premium is worth every rupee.", rating: 5 },
  { name: "Sara Thomas", role: "Student, Kochi", quote: "I found my favourite indie artists through Sunset Blvd. The playlists feature is addictive.", rating: 5 },
] as const;
