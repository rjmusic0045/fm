// Seeds stations and songs from the demo catalog, and optionally an admin user.
// Idempotent: safe to run repeatedly (upserts by slug / email).
//
// npm run db:seed
// SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='S3cure!pass' npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { songs, stations } from "../src/data/catalog";

const prisma = new PrismaClient();

const genreBySong: Record<string, string> = {
  "midnight-drive": "Synthwave",
  "city-rain": "Lo-fi",
  "golden-hour": "Indie Pop",
  "paper-planes": "Indie Pop",
  "neon-heart": "Pop",
  satellite: "Electronic",
  "slow-motion": "R&B",
  "static-dreams": "Ambient",
};

async function main() {
  for (const s of stations) {
    const data = {
      name: s.name,
      frequency: s.frequency,
      genre: s.genre,
      city: s.city,
      streamUrl: s.streamUrl,
      coverFrom: s.palette[0],
      coverTo: s.palette[1],
      listeners: s.listeners,
      isActive: true,
    };
    await prisma.station.upsert({ where: { slug: s.id }, create: { slug: s.id, ...data }, update: data });
  }
  console.log(`✓ ${stations.length} stations`);

  for (const s of songs) {
    const data = {
      title: s.title,
      artist: s.artist,
      album: s.album,
      genre: genreBySong[s.id] ?? "Pop",
      duration: s.duration,
      audioUrl: s.src,
      coverFrom: s.palette[0],
      coverTo: s.palette[1],
      isActive: true,
    };
    await prisma.song.upsert({ where: { slug: s.id }, create: { slug: s.id, ...data }, update: data });
  }
  console.log(`✓ ${songs.length} songs`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 8) throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters");
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        name: "Lumen Admin",
        passwordHash,
        role: "ADMIN",
        onboarded: true,
        emailVerified: new Date(),
      },
      update: { role: "ADMIN", passwordHash },
    });
    console.log(`✓ admin user ${adminEmail}`);
  } else {
    console.log("• skipped admin user (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one)");
  }

  // Optional regular listener account for testing plays/likes as a normal user.
  const userEmail = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const userPassword = process.env.SEED_USER_PASSWORD;
  if (userEmail && userPassword) {
    if (userPassword.length < 8) throw new Error("SEED_USER_PASSWORD must be at least 8 characters");
    const passwordHash = await bcrypt.hash(userPassword, 12);
    await prisma.user.upsert({
      where: { email: userEmail },
      create: { email: userEmail, name: "Demo Listener", passwordHash, role: "USER", onboarded: true, emailVerified: new Date() },
      update: { passwordHash },
    });
    console.log(`✓ listener user ${userEmail}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
