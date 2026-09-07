# part2 — FoodGroups API

REST backend for the `part1/` frontend. Express 5 + TypeScript + PostgreSQL.

Responses are shaped to match `part1/src/types/index.ts` exactly, so wiring the
frontend up is a matter of replacing the localStorage calls in `AppContext` with
`fetch` — no component or type changes needed.

## Running it

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npm run db:migrate        # applies src/db/schema.sql (idempotent)
npm run dev               # http://localhost:4000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

### Without a Postgres installed

`npm run test:smoke` runs the whole API end-to-end against PGlite (Postgres
compiled to WASM) over the wire protocol — no Docker, no local Postgres, but the
real SQL is executed. 41 checks covering auth, membership, upserts and like
toggles.

## Endpoints

All routes except `/health` and the two `/auth` entry points require
`Authorization: Bearer <token>`. Everything below the group level is authorised
by group membership — a non-member gets 403, never data.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `POST` | `/auth/register` | `{email, password, name, avatar?, color?}` → `{user, token}` |
| `POST` | `/auth/login` | `{email, password}` → `{user, token}` |
| `GET` | `/auth/me` | Current user |
| `PATCH` | `/auth/me` | Update name / avatar / colour (backs ProfilePage) |
| `GET` | `/groups` | Caller's groups, fully nested |
| `POST` | `/groups` | Create; creator becomes first member |
| `GET` | `/groups/:id` | One group, fully nested |
| `POST` | `/groups/:id/join` | `:id` is a group UUID **or** an invite code |
| `GET` | `/groups/:groupId/foods` | Food items with reviews and comments |
| `POST` | `/groups/:groupId/foods` | `{name, description?, category?, imageUrl?}` |
| `GET` | `/foods/:id` | One food item |
| `GET` | `/foods/:foodId/reviews` | |
| `POST` | `/foods/:foodId/reviews` | `{rating: 1-5, text?}`; upserts — one review per member |
| `POST` | `/reviews/:id/like` | Toggles |
| `GET` | `/foods/:foodId/comments` | |
| `POST` | `/foods/:foodId/comments` | `{text}` |
| `POST` | `/comments/:id/like` | Toggles |

Errors come back as `{ error, details? }` with the status in the response code:
400 validation, 401 auth, 403 membership, 404 missing, 409 conflict.

## Layout

```
src/
  app.ts              Express app: middleware + router mounting
  index.ts            Server entry, graceful shutdown
  config.ts           Env parsing; throws on missing DATABASE_URL / JWT_SECRET
  db/
    schema.sql        Tables, constraints, indexes
    migrate.ts        Applies schema.sql
    pool.ts           pg Pool + transaction helper
    repository.ts     Assembles the nested Group shape the frontend expects
  middleware/
    auth.ts           JWT signing, requireAuth, assertGroupMember
    errors.ts         Zod + HttpError -> JSON responses
  routes/             auth, groups, foods, reviews, comments
scripts/
  smoke-test.ts       End-to-end test against PGlite
```
