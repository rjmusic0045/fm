# Lumen FM

A premium live FM radio and music streaming SaaS built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, NextAuth, Prisma and MongoDB.

Signature feature: the **"pull the lamp" login**. The sign-in page starts dark; drag the lamp's pull-cord down to switch on the light and reveal the form.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 14 App Router, React 18, TypeScript (strict) |
| Styling | Tailwind CSS, shadcn/ui-style components, Framer Motion |
| Auth | NextAuth v4: Facebook OAuth + email/password (credentials), JWT sessions |
| Database | MongoDB via Prisma 6 (replica set required) |
| Audio | HTML5 Audio, one global engine (zustand store), Media Session API |
| Email | Nodemailer over SMTP (Resend, Postmark, SendGrid, Mailtrap…) |
| Payments | Stripe Checkout + Customer Portal (Phase 7) |
| Hosting | Vercel |

## Quick start

```bash
npm install                # also runs `prisma generate`
cp .env.example .env       # then fill in the values (see below)
npm run db:push            # create collections + indexes in MongoDB
npm run db:seed            # sample stations & songs (+ optional admin user)
npm run dev                # http://localhost:3000
```

### 1. MongoDB

Prisma needs MongoDB running as a **replica set** (it uses transactions).

**Option A: MongoDB Atlas (recommended, free tier)**

1. Create a free cluster at <https://www.mongodb.com/atlas>.
2. *Database Access* → add a database user. *Network Access* → allow your IP (and `0.0.0.0/0` for Vercel).
3. *Connect → Drivers* → copy the connection string and add a database name:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/lumen?retryWrites=true&w=majority`
4. Put it in `DATABASE_URL`.

**Option B: local Docker**

```bash
docker compose up -d   # single-node replica set, initialised automatically
# DATABASE_URL=mongodb://localhost:27017/lumen?replicaSet=rs0&directConnection=true
```

**Option C: local mongod install**

```bash
mongod --replSet rs0 --dbpath <data-dir>
mongosh --eval "rs.initiate()"          # once
```

### 2. NextAuth

```bash
openssl rand -base64 32   # -> NEXTAUTH_SECRET
```

Set `NEXTAUTH_URL` to the app's base URL (`http://localhost:3000` locally, your domain in production).

### 3. Facebook login (optional)

The "Continue with Facebook" button shows a friendly notice until this is configured.

1. Go to <https://developers.facebook.com/apps> → **Create app** → use case **"Authenticate and request data from users with Facebook Login"**.
2. In the app dashboard: **Use cases → Facebook Login → Customize → Settings**.
3. Add **Valid OAuth Redirect URIs**:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://YOUR-DOMAIN/api/auth/callback/facebook`
4. Under **Permissions**, make sure `email` and `public_profile` are added.
5. **App settings → Basic**: copy **App ID** → `FACEBOOK_CLIENT_ID` and **App Secret** → `FACEBOOK_CLIENT_SECRET`. Add a Privacy Policy URL (`https://YOUR-DOMAIN/privacy`) and app domain.
6. While the app is in *Development* mode only users with a role on the app can log in. Switch it to *Live* when ready.

Accounts are not auto-linked by email (safer default): if someone signed up with email/password and later tries Facebook with the same address, they see a message asking them to sign in with email.

### 4. Email (password reset, verification)

Set `EMAIL_SERVER` to an SMTP URL and `EMAIL_FROM` to a verified sender. Examples:

- Resend: `smtp://resend:RE_xxxxxxxx@smtp.resend.com:587`
- Mailtrap (testing): `smtp://USER:PASS@sandbox.smtp.mailtrap.io:2525`

Without `EMAIL_SERVER`, emails are **printed to the dev server console** so the flows can be tested locally.

### 5. Admin user

```bash
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='Str0ngPassword' npm run db:seed
```

## Auth & security

- Passwords hashed with **bcrypt** (12 rounds); timing is equalised for unknown accounts.
- **Rate limiting** stored in MongoDB (works across serverless instances): 8 login attempts per email and 30 per IP every 15 minutes; 3 reset emails per address and 10 per IP per hour.
- Login tells users when **no account exists** for an email and offers to create one (a deliberate UX choice from the product spec; rate limiting curbs enumeration).
- **Remember me**: 30-day session when checked, 24 hours otherwise.
- **Password reset** tokens are random 256-bit values, stored only as SHA-256 hashes, valid for 1 hour and single-use. The forgot-password endpoint answers identically whether or not the email exists.
- **Middleware** guards `/dashboard`, `/onboarding`, `/settings`, `/library`, `/billing` and `/admin` (ADMIN role only), sends un-onboarded users to `/onboarding`, and bounces signed-in users away from `/login` and `/signup`.
- Session cookies are HttpOnly and SameSite=Lax (NextAuth defaults); JSON endpoints also reject cross-origin requests.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run typecheck` / `npm run lint` | Type and lint checks |
| `npm run db:push` | Sync the Prisma schema to MongoDB (collections + indexes) |
| `npm run db:seed` | Seed stations, songs and an optional admin |
| `npm run db:studio` | Browse data in Prisma Studio |

## Deploying to Vercel

1. Push the repo and import it in Vercel.
2. Add every variable from `.env.example` in *Project → Settings → Environment Variables* (`NEXTAUTH_URL` = your production URL).
3. In Atlas, allow access from Vercel (`0.0.0.0/0` or Vercel's IP ranges).
4. Run `npm run db:push && npm run db:seed` once against the production database.
5. Add the production callback URL in the Facebook app.

## Project structure

```
prisma/
  schema.prisma          MongoDB data model
  seed.ts                Idempotent seed (stations, songs, admin)
src/
  app/
    (marketing)/         Public pages: home, styleguide, terms, privacy
    (auth)/              Lamp scene pages: login, forgot/reset password
    (app)/               Signed-in app (dashboard)
    api/auth/            NextAuth route handler
    api/password/        forgot + reset endpoints
  components/
    auth/                Lamp scene, auth forms, password strength meter
    home/                Landing page sections
    player/              Audio engine, mini-player, preview gate, cover art
    layout/ ui/ motion/  Navbar, footer, design-system primitives
    providers/           Session + global player providers
  config/                Site and plan configuration
  data/                  Demo catalog (also used by the seed)
  lib/                   auth, prisma, rate limiting, tokens, email, validation
  stores/                zustand player store
  middleware.ts          Route protection
```

## Build phases

1. Design system & layout ✅
2. Home page & player ✅
3. Lamp login page ✅
4. Auth backend (MongoDB, NextAuth, reset flow, rate limiting, middleware) ✅
5. Signup & onboarding
6. Dashboard
7. Stripe billing
8. Admin panel
