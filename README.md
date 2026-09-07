# FoodGroups

A social food discovery app for friend groups — create or join a group, add food items, rate and review them, and discuss in comments.

- **`part1/`** — React 19 + TypeScript + Vite frontend
- **`part2/`** — Express 5 + TypeScript + PostgreSQL REST API

See `part1/README.md` and `part2/README.md` for details on each half. This file covers running the two together.

## Prerequisites

- Node.js 20+
- A PostgreSQL database (local install, Docker, or a hosted instance)

## 1. Backend (`part2/`)

```bash
cd part2
npm install
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to point at your Postgres, and `JWT_SECRET` to a random string:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Apply the schema, then start the API:

```bash
npm run db:migrate   # creates tables — safe to re-run
npm run dev           # http://localhost:4000
```

**No Postgres installed?** `npm run test:smoke` runs the whole API against PGlite (Postgres compiled to WASM, no install needed) and prints 41 pass/fail checks — a quick way to confirm the backend works before wiring up real infrastructure.

## 2. Frontend (`part1/`)

In a second terminal:

```bash
cd part1
npm install
cp .env.example .env   # only needed if the API isn't on http://localhost:4000
npm run dev             # http://localhost:5173
```

Open `http://localhost:5173`. You'll land on `/login` — register a new account to get started (there is no seeded demo user; each account starts with zero groups).

## Everyday flow

1. Register (or log in) at `/login` / `/register`.
2. Create a group from the home page, or join an existing one with its invite code.
3. Add food items to a group, then open one to rate it (1–5 stars + optional text), like others' reviews, and comment.
4. Edit your display name, avatar emoji, and accent color from `/profile`.

A note on sessions: the auth token is kept in memory, not `localStorage`, so a hard page refresh logs you out — this is deliberate (see `part2/README.md` and `part1/src/context/AuthContext.tsx` for why). Log back in and your data is still there; nothing is lost, since everything lives in Postgres, not the browser.

## Building for production

```bash
cd part2 && npm run build && npm start     # compiles to dist/, then runs it
cd part1 && npm run build                   # outputs part1/dist/, deploy as static files
```

Set `VITE_API_URL` (frontend) and `CORS_ORIGIN` (backend) to your real deployed URLs before building.
