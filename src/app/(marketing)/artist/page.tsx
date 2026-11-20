import type { Metadata } from "next";
import { ArtistProfile } from "@/components/artist/artist-profile";
import { artist } from "@/data/artist";

export const metadata: Metadata = {
  title: `${artist.name} · ${artist.city}`,
  description: `Stream ${artist.name}'s tracks, albums, playlists and reposts on Lumen FM.`,
};

export default function ArtistPage() {
  return <ArtistProfile />;
}
