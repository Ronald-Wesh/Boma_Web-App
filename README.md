# Boma

Student-first housing marketplace for Kenyan university students — verified listings,
building reviews, roommate matching, a map view, and a campus forum.

## Stack

- **Client:** React 19 + Vite, Tailwind CSS v4, React Router, Leaflet (map), Sonner (toasts)
- **Server:** Express 5 + Mongoose (MongoDB), JWT auth, Google Sign-In (`google-auth-library`)
- **Monorepo:** `client/` and `server/` are independent pnpm packages; run each separately
  or both together via the root `dev` script.

## Features

- **Auth** — email/password and Google Sign-In, role-based (tenant/landlord) post-login
  redirect
- **Browse & Listing Detail** — filterable listing search, geo-aware similar listings,
  building reviews
- **Map View** — split list/map layout backed by geospatial queries; every listing requires
  a real location to be created
- **Roommates** — compatibility-ranked matching by budget/lifestyle/move-in timing, plus
  connect requests (send, accept/decline, live status on each card)
- **Reviews & Forum** — per-building review aggregation, campus discussion threads

## Setup

```bash
pnpm install:all          # installs client + server + root dev tooling
```

Copy the example env files and fill in real values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`server/.env` needs a running MongoDB (`MONGO_URI`), a `JWT_SECRET`, and (optional but
required for Google Sign-In) a `GOOGLE_CLIENT_ID` matching the one in `client/.env`'s
`VITE_GOOGLE_CLIENT_ID` — both must reference the *same* Google OAuth client, and that
client's authorized JavaScript origins must include whichever origin you run the client on.

Seed the database with demo data (campuses, listings, buildings, reviews, roommate
profiles, forum threads — wipes and repopulates those collections):

```bash
pnpm --dir server seed
```

Demo logins after seeding (all use password `Password123`):

- `admin@boma.co.ke`
- `landlord1@boma.co.ke` (…through `landlord4@`)
- `student1@students.boma.co.ke` (…through `student16@`)

Run both client and server together:

```bash
pnpm dev
```

Or independently:

```bash
pnpm dev:client   # http://localhost:5173
pnpm dev:server   # http://localhost:5000
```
