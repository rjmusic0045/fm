# Lumen FM: Project Audit and Implementation Plan

Audit date: 23 Nov 2026 · Repo: `rjmusic0045/fm` (branch `main`) · Live: `ganesh-fm-a4b6a2hpc4gwg3g8.southindia-01.azurewebsites.net`

This is Phase 1 of the enhancement brief. No application code was changed for the audit. Section 0 explains the state of work that was already in progress when the brief arrived.

---

## 0. State of the code at audit time

There are two layers of code.

| Layer | Status |
|---|---|
| **Committed and deployed** (`main` @ `b63a569`) | Running on Azure. Includes song upload, plays and likes, Blob storage, auth, the health check, and the deployment workflow. |
| **Working tree, not committed** (47 files) | Admin modules for artists, albums, podcasts and episodes, users and plans, and pricing. Also the Free/Premium entitlement system, the duplicate-login (single device) control, and the plan-expiry popup. The schema is already pushed to Atlas; those changes are additive only. **This code typechecks and lints, but it hasn't been tested end to end, committed or deployed.** |

Everything marked "(working tree)" below refers to that second layer. Before Phase 2 continues it needs an end-to-end test, a commit and a deploy (see §11).

---

## 1. Architecture

| Area | Implementation |
|---|---|
| Framework | **Next.js 14.2** (App Router), React 18, TypeScript (non-strict) |
| Styling | Tailwind 3 with a custom design system: `glass` and `glass-strong` surfaces, `neon-*` tokens remapped to a light indigo palette, Radix Dialog, `class-variance-authority` buttons |
| State | Zustand (`src/stores/player-store.ts`) |
| Auth | NextAuth v4: Credentials (bcrypt) and optional Facebook OAuth, JWT sessions, Prisma adapter |
| Database | **MongoDB Atlas** through Prisma 6 (`prisma/schema.prisma`) |
| Media storage | **Azure Blob Storage** (private container `uploads`), streamed through `/api/media/*` with HTTP Range support. Falls back to local disk in development. |
| Hosting | Azure App Service (Linux, Node 20), Next.js standalone output, GitHub Actions deploy with a publish profile |
| Email | Nodemailer (SMTP). Logs to the console when unconfigured. |
| Payments | **None.** Stripe environment variables exist as placeholders only. |

### Folder structure

```
src/
  app/
    (marketing)/   home, music, artist (demo), privacy, terms, styleguide   ← Navbar + Footer + MiniPlayer layout
    (auth)/        login, forgot-password, reset-password                    ← dark "lamp" scene
    (app)/         dashboard, admin/*                                         ← protected by middleware
    api/           route handlers (see §5)
  components/      admin, artist, audio, auth, brand, home, layout, motion, music, player, providers, ui
  lib/             auth, admin, entitlement*, plans*, storage, songs, catalog-db*, rate-limit, email, tokens, …
  data/            catalog.ts (static demo stations/songs), artist.ts (static demo profile)
  stores/          player-store.ts
  middleware.ts    route protection
prisma/            schema.prisma, seed.ts
.github/workflows/ azure-webapp.yml
```

`*` = working tree only.

---

## 2. Authentication and authorization

| Capability | Status |
|---|---|
| Email + password login, "remember me" (30 days or 1 day), rate limiting (per IP and per email) | ✅ Exists |
| Facebook OAuth | ✅ Exists (off until credentials are configured) |
| Forgot / reset password (hashed one-time tokens, email) | ✅ Exists |
| **Signup page / register API** | ❌ **Missing.** `/signup` returns 404, but the login page and the preview gate link to it. Accounts currently come only from the seed script. |
| Onboarding (`/onboarding`) | ❌ Missing. Middleware redirects new OAuth users there, so it would 404. |
| Roles | `USER` and `ADMIN` (`Role` enum). `/admin` is gated in middleware, and `getAdminSession()` re-checks the role in the database on every admin request and API call. |
| Single active device (duplicate-login control) | 🟡 Working tree: `User.activeSessionId`, a takeover prompt at login, and a notice on the device that was signed out |
| Account activate / deactivate | ❌ Missing (no `disabled` flag) |
| Fine-grained permissions | ❌ Missing. Two roles only, which is adequate for now. |

---

## 3. Database models (MongoDB via Prisma)

| Model | Purpose | Status |
|---|---|---|
| User, Account, Session, VerificationToken, PasswordResetToken | Auth | ✅ |
| RateLimit | Shared rate limiter | ✅ |
| Station | Radio stations | ✅ Model exists and holds 8 seeded rows, **but no page or API reads it.** The UI uses the static `data/catalog.ts`. |
| Song | Tracks with plays, access, artist and album links | ✅ Extended in the working tree (`access`, `artistId`, `albumId`, `trackNumber`) |
| Artist, Album | Catalog | 🟡 Working tree (in DB) |
| Podcast, PodcastEpisode | Podcasts | 🟡 Working tree (in DB). Has episode numbers but **no seasons or episode artwork.** |
| PlanConfig | Admin-editable plan prices and features | 🟡 Working tree (in DB) |
| Playlist, PlaylistSong | Playlists | 🟡 Models only. No API or UI. |
| Favorite | Song likes (used); station favorites (model only) | 🟡 Partial |
| ListeningHistory | Song plays (signed-in users); episodes in the working tree | ✅ Recorded. No user-facing view. |
| Subscription | Plan, status, period end, Stripe IDs | ✅ Model. Admins grant plans manually (working tree). |
| Genre, Language | | ❌ Free-text `genre` field. **No language field anywhere.** |
| Payment, Advertisement, Notification, AuditLog | | ❌ Missing |

Every schema change so far has been **additive** (new optional fields and new collections). No data was dropped.

---

## 4. Audio player

The global player is mounted once in the root layout: `AudioEngine` holds a single `HTMLAudioElement`, and `MiniPlayer` renders the bar. Playback **persists across client-side navigation**.

| Capability | Status |
|---|---|
| Play/pause, next/previous, seek, volume and mute, current item info, cover art | ✅ |
| Queue (play a list from an index) | ✅ Internal. **No queue view or editing UI.** |
| Shuffle / repeat | ❌ |
| Podcast playback speed, resume position, sleep timer | ❌ |
| Live radio | 🟡 **Simulated:** looping MP3s that start at a random point. No real stream or HLS support. |
| OS media keys / lock screen (Media Session) | ✅ |
| Guest preview limit (30 s) with sign-in popup | ✅ |
| Premium preview limit with upgrade popup | 🟡 Working tree |
| Play counting (counted after 20 s, per-listener rate limit) | ✅ Songs; episodes in the working tree |

---

## 5. API endpoints

| Endpoint | Methods | Notes |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth |
| `/api/password/forgot`, `/api/password/reset` | POST | |
| `/api/health` | GET | Reports whether settings are present (never their values) and pings the database |
| `/api/media/[...path]` | GET | Streams media from Blob or disk with Range support. **No access check** (see §10). |
| `/api/songs/[id]/play`, `/api/songs/[id]/like` | POST | |
| `/api/admin/songs`, `/api/admin/songs/[id]` | POST, PATCH, DELETE | PATCH now edits every field (working tree) |
| `/api/me/entitlement` | GET | Working tree |
| `/api/episodes/[id]/play` | POST | Working tree |
| `/api/admin/artists[/id]`, `/albums[/id]`, `/podcasts[/id]`, `/podcasts/[id]/episodes`, `/episodes/[id]` | POST, PATCH, DELETE | Working tree |
| `/api/admin/pricing` | PUT | Working tree |
| `/api/admin/users/[id]` | POST (grant / expire / remove plan, sign out, change role) | Working tree |

**Missing:** search, playlists, library (saved albums, followed artists and podcasts), station favorites, signup, profile and settings, payments and webhooks, ads, analytics.

---

## 6. File uploads

- Admin uploads go through `multipart/form-data`. They're validated by MIME type and size (audio ≤ 50 MB; images ≤ 5 MB, JPG/PNG/WEBP), stored under random names, and orphaned files are cleaned up if the database write fails.
- Storage backend: `src/lib/storage.ts`. Azure Blob when a connection string or account key is set, local disk otherwise.
- Audio duration is read in the browser before upload. There is **no server-side transcoding**: files are served as uploaded, so there are no separate quality levels.

---

## 7. Subscriptions and payments

| Capability | Status |
|---|---|
| Plans (Free / Premium / Family) | ✅ Static config. Admin-editable through `PlanConfig` in the working tree. |
| Entitlement service (`getEntitlement`: active / expired / none, `canPlayPremium`, days left) | 🟡 Working tree |
| Free vs Premium per song, album and podcast (`Access` enum; Premium album makes its songs Premium) | 🟡 Working tree |
| Expiry handling and popups on login (plan ended / ends within 3 days) | 🟡 Working tree |
| Admin-granted renewals and cancellations | 🟡 Working tree |
| **Payment gateway, checkout, webhooks, payment history, auto-renewal** | ❌ Missing |
| Monthly/yearly prices | 🟡 Monthly prices plus a fixed 20% yearly discount in config. No separate yearly prices in the database. |
| Ads for Free users, skip limits, audio quality tiers, downloads | ❌ Missing. Advertised on the Pricing page but not implemented. |

---

## 8. UI and design system

- Current look: **light and minimal** (white surfaces, zinc neutrals, one indigo accent). This was explicitly requested on 20 Nov, replacing the earlier neon dark theme.
- Exception: the auth pages keep a dark "lamp" scene (scoped `.theme-dark`).
- Marketing pages use a top navbar. It's session-aware (`useIsSignedIn`): Sign out and Dashboard when signed in. *Correction:* the first version of this audit wrongly said it wasn't. Phase B added an avatar menu with Settings and Admin.
- Admin: a header with section tabs (working tree), plus tables, cards and dialog forms.
- Missing: a user app shell (sidebar, library), a search UI, consistent loading and error states (`loading.tsx` / `error.tsx`).

> **Decision needed:** the brief says to use a premium dark interface if the design needs improvement, but the current light theme was a deliberate earlier request. The plan keeps the light theme unless you say otherwise.

---

## 9. Feature comparison

| Feature | Existing status | Required action |
|---|---|---|
| Admin Dashboard | Partial: counts for songs, plays, listeners, likes, artists, albums, podcasts and paid plans (working tree). No top lists or recent activity. | **Enhance** (most played, popular podcasts, recent activity, station and user totals) |
| User Dashboard | Partial: a placeholder page showing account info | **Implement** (home feed, library, profile) |
| Music Management | Partial: upload, edit, hide/publish, delete, preview, cover, genre, Free/Premium (working tree) | **Enhance:** language, release date, draft/scheduled status, archive |
| Artist Management | Exists (working tree): create, edit, delete, photo, bio, verified, links to songs/albums/podcasts | **Skip** (test and ship) |
| Album Management | Exists (working tree): cover, tracklist order, artist, year, access, publish | **Enhance:** full release date, scheduling |
| Podcast Management | Partial (working tree): shows, episodes, host, descriptions, numbers, access | **Enhance:** seasons, episode artwork, scheduled publishing |
| Live Radio | Partial: Station model plus a static simulated UI. No admin. | **Implement:** admin CRUD, real stream/HLS URLs, logo, language, enable/disable, health check, DB-driven UI |
| Audio Player | Partial (see §4) | **Enhance:** shuffle, repeat, queue UI, speed, resume, sleep timer, real live streams |
| Playlists | Missing (models only) | **Implement** |
| Favorites | Partial: song likes only | **Enhance:** stations, albums (save), artists and podcasts (follow), episodes |
| Search | Missing | **Implement** (songs, artists, albums, podcasts; filter by genre and language) |
| Listening History | Partial: recorded, never shown | **Implement** "Recently played" and the history view |
| Free Subscription | Partial (working tree): previews for Premium content | **Enhance:** ads, skip limits (needs product rules) |
| Premium Subscription | Partial (working tree): entitlement, admin grants, expiry popups | **Enhance:** server-side media enforcement (§10), quality tiers |
| Payment Integration | Missing | **Implement:** gateway, checkout, verified webhooks, Payment model, history (needs a decision) |
| Advertisement Management | Missing | **Implement:** campaigns, audio ads, frequency, Free-tier playback |
| Analytics | Partial: per-song plays, listeners and likes; episode plays | **Implement** DAU/MAU, listening hours, top content, subscription and revenue reports |
| Role-Based Access | Exists: USER/ADMIN, middleware, DB re-check on admin APIs | **Enhance:** account deactivation, admin audit log |
| Signup / Onboarding | **Missing (broken links)** | **Implement** (high priority) |
| User Profile / Settings | Missing (`/settings` route is protected but doesn't exist) | **Implement** (languages, genres, account, subscription) |

---

## 10. Risks and issues found

1. **Premium audio isn't protected on the server.** `/api/media/*` serves any file to anyone with the URL, so the Premium preview limit is enforced only in the browser. The brief requires backend enforcement. Fix: issue short-lived signed media URLs or tokens, check entitlement when issuing them, and cut off Premium items for non-subscribers at the preview length on the server.
2. **Broken links:** `/signup`, `/onboarding`, `/settings`, `/library` and `/billing` are referenced or protected but don't exist.
3. **Leaked credentials:** the Atlas password, the Azure Storage account key and the admin seed password were pasted in chat. Rotate them before public launch.
4. **Shared database:** local development and production both point at the same Atlas database (`LAMP`). Test uploads and seed runs affect live data. Recommendation: a separate `LAMP_dev` database.
5. **Static demo data** (`data/catalog.ts`, `data/artist.ts`) still powers the home page stations and songs and the `/artist` page. The brief rules out mock data in production features, so these should switch to the database.
6. **Pricing page promises** (ads, 6 skips per hour, 320 kbps, offline downloads) that aren't implemented.
7. The play counter is rate-limited per listener, but guest plays are keyed by IP address, so users behind the same network share a limit.
8. **Fixed in Phase C:** on Azure, `X-Forwarded-For` includes the client port (`1.2.3.4:56789`). Every connection got its own rate-limit bucket, so **IP rate limiting (login, signup, password reset, guest plays) was ineffective in production**. `clientIp()` now strips the port.

---

## 11. Implementation plan

Each phase ends with typecheck, lint and production build, end-to-end API tests, page smoke tests, deploy, and a summary. **I'll stop for confirmation after each phase.**

| Phase | Scope | Notes |
|---|---|---|
| **A. Finish and ship the in-progress admin work** | Test the working tree end to end (artists, albums, podcasts, users and plans, pricing, entitlement, duplicate login, expiry popup); add the listener pages for albums, podcasts and artists already started; commit and deploy | No new scope. Closes the open work. |
| **B. Accounts** | Signup with validation, onboarding (genres and languages), profile and settings, session-aware navbar, account activate/deactivate | Fixes the broken links |
| **C. Catalog depth** | Language and release date on songs and albums; draft/published/scheduled status; podcast seasons and episode artwork; Genre and Language lists | Additive schema changes |
| **D. Live radio** | Admin station CRUD (logo, description, stream URL, HLS via `hls.js`, language, genre, enable/disable, schedule), stream health check, DB-driven radio pages, station favorites | Replaces the static station data |
| **E. Player** | Shuffle, repeat, queue panel, podcast speed, resume position, sleep timer | Builds on the existing engine |
| **F. Library and discovery** | Search and filters, playlists, saved albums, followed artists and podcasts, liked songs, recently played, home feed (trending, new releases, featured, recommendations) | |
| **G. Server-side entitlement** | Signed media URLs and a preview cutoff on the server; Free-tier skip limits | Closes risk §10.1 |
| **H. Payments** | Gateway checkout, verified webhooks, Payment model and history, renewals, cancellations, admin subscription view | Needs a gateway decision |
| **I. Ads** | Advertisement and campaign models, admin management, audio ads for the Free tier with frequency rules | |
| **J. Analytics and audit** | DAU/MAU, listening hours, top songs, podcasts and stations, subscription and revenue reports; admin audit log; notifications | |

### Decisions needed before the relevant phase

1. **Payment gateway (Phase H):** Razorpay (best fit for INR, UPI and Indian cards) or Stripe (the existing placeholders; international cards).
2. **Theme (§8):** keep the current light theme (default) or switch the user app to dark.
3. **Free-tier rules (Phases G and I):** skip limit per hour, ad frequency, preview length for Premium items (currently 30 s).
4. **Separate development database (§10.4):** recommended yes.
