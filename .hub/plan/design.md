# FoodGroups — Design

## Architecture Overview

FoodGroups is a **single-page application (SPA)** built with Vite + React 18 + TypeScript. Phase 1 is entirely frontend — no backend server. All data lives in the browser via `localStorage`.

```
[Browser]
  ├── React SPA (Vite + React Router v6)
  │     ├── AppContext (global state + actions)
  │     ├── localStorage (persistence layer)
  │     └── Pages / Components
  └── .hub/ (TeamHub task & plan tracking)
```

Phase 2 (future) will replace the localStorage layer with a real REST API.

---

## Frontend Stack

| Layer | Choice | Rationale |
|---|---|---|
| Build tool | Vite 8 | Fast HMR, zero-config TS |
| UI library | React 18 | Component model, hooks |
| Language | TypeScript | Type safety across all data models |
| Routing | React Router v6 | Nested routes, URL-driven state |
| State | React Context + localStorage | No extra deps; easy to swap for API |
| Styling | Vanilla CSS + CSS Modules | Per project guidelines; token-based design system |
| Icons | Lucide React | Consistent, lightweight |
| Fonts | Inter + Playfair Display (Google Fonts) | Premium feel |

---

## Data Models

```typescript
Member       { id, name, avatar (emoji), color }
Group        { id, name, description, emoji, color, inviteCode, members[], foodItems[] }
FoodItem     { id, name, category, description, imageUrl, reviews[], comments[] }
Review       { id, memberId, rating (1-5), text, likes[] }
Comment      { id, memberId, text, likes[] }
FoodCategory = 'Appetizer' | 'Main Course' | 'Dessert' | ... (union type)
```

All defined in `part1/src/types/index.ts`.

---

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | HomePage | Groups grid, hero, join/create |
| `/groups/:groupId` | GroupPage | Food items grid, category filter, banner |
| `/groups/:groupId/food/:foodId` | FoodDetailPage | Image, rating, reviews tab, discussion tab |
| `/profile` | ProfilePage | Name/avatar/colour editor, activity stats |

---

## Component Hierarchy

```
App
├── Navbar
├── HomePage
│     ├── GroupCard (xN)
│     └── CreateGroupModal
├── GroupPage
│     ├── FoodCard (xN)
│     └── AddFoodModal
├── FoodDetailPage
│     ├── StarDisplay / StarInput
│     ├── Review cards
│     └── Comment thread
└── ProfilePage
```

---

## State Management

- Single `AppContext` wraps the whole app
- State shape: `{ currentUser: Member, groups: Group[] }`
- Every action (createGroup, addFoodItem, addReview, addComment, likeReview, likeComment) returns a new state object — no mutations
- State is serialised to `localStorage` on every change via `useEffect`
- On first load, seeds with `SEED_DATA` (2 demo groups, 3 food items, reviews, comments)

---

## Design System

- **Theme**: Dark mode, warm stone/charcoal base (`#0c0a09`)
- **Accent**: Amber `#f59e0b` with orange gradient highlights
- **Cards**: Glassmorphism — `backdrop-filter: blur` + semi-transparent bg
- **Typography**: Inter (body) + Playfair Display (headings)
- **Tokens**: All colours, radii, shadows defined as CSS custom properties in `global.css`
- **Responsive**: CSS Grid `auto-fill / minmax` for all card grids

---

## Phase 2 — Backend Design (Planned, Not Built)

### Stack Candidates
- **Node.js + Express + PostgreSQL** (self-hosted, full control)
- **Supabase** (managed Postgres + Auth + Realtime out of the box — preferred for speed)

### API Surface (proposed)

```
POST   /auth/register          Register user
POST   /auth/login             Login, return JWT

GET    /groups                 List user's groups
POST   /groups                 Create group
POST   /groups/:id/join        Join via invite code

GET    /groups/:id/foods       List food items
POST   /groups/:id/foods       Add food item

GET    /foods/:id/reviews      List reviews
POST   /foods/:id/reviews      Add / update review

GET    /foods/:id/comments     List comments
POST   /foods/:id/comments     Add comment
POST   /comments/:id/like      Toggle like
```

### Key Backend Tasks (declared separately in hub)
- `Build Backend API` — Express/Supabase setup, DB schema, all routes
- `Add Authentication` — JWT or Supabase Auth
- `Wire Frontend to API` — replace AppContext localStorage with fetch calls
- `Add Image Upload` — Supabase Storage or Cloudinary
