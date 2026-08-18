# Storeroom Ledger

Inventory system for a Scout troop storeroom: what the troop owns, where in the
den it lives, who has it out, and an append-only log of every movement.

A React SPA talking straight to Supabase — there is no backend of our own. The
browser holds only a publishable key, and **every authorisation decision is made
by Postgres row-level security**.

| | |
|---|---|
| Frontend | React 19 + Vite 8, no router, no state library, inline styles |
| Backend | Supabase (Postgres, Auth, Storage) |
| Tests | Vitest + React Testing Library (unit) and a real local Postgres (integration) |
| Hosting | Vercel — `main` is Production, every other branch is a Preview |

---

## Running a local instance

### Prerequisites

- **Node 20+** (developed on 26) and npm
- **Docker Desktop, running** — the Supabase CLI starts Postgres, Auth, Storage
  and a mail catcher as containers. Nothing works until Docker is up.

The Supabase CLI is invoked with `npx supabase`; there is no global install to
do. Note the `npx` prefix — `supabase db reset` on its own will fail with
`command not found: db`.

### First run

```bash
git clone https://github.com/abnerthen/digital-scoutden.git
cd digital-scoutden
npm install

npx supabase start          # first run pulls images; takes a few minutes
npx supabase db reset       # applies migrations, then loads the seed data

cp .env.example .env.local
npm run dev
```

Open http://localhost:5173 and sign in as **`qm@troop.test` / `password123`**.

### ⚠️ If the app talks to the wrong database

`.env.local` is read by Vite, but **real environment variables win over it**. If
`VITE_SUPABASE_URL` is exported in your shell (some editors and terminal
profiles do this), the app will silently use that instead — potentially the
production project. Symptoms are local edits not appearing, or `.env.local`
seeming to have no effect at all.

```bash
env | grep VITE_          # should print nothing
unset VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY
```

This one has cost real debugging time. Check it first.

### What's now running

| Service | URL | Notes |
|---|---|---|
| App | http://localhost:5173 | `npm run dev` |
| Supabase API | http://127.0.0.1:54321 | `VITE_SUPABASE_URL` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | |
| Studio | http://127.0.0.1:54323 | table editor, SQL editor, auth users |
| Mailpit | http://127.0.0.1:54324 | catches every outbound email |

`npx supabase status` reprints these along with the keys.

---

## Seed data

`supabase/seed.sql` loads on every `npx supabase db reset`: 7 members, 4
categories, 4 storeroom locations, 7 items, 2 patrol groups, an open checkout
and a few log entries.

Only `qm@troop.test` has a login. The other members exist as rows without an
account, which is the normal state — most Scouts never sign in.

**The seed refuses to run against a database that already has members.** It is
development scaffolding, and filling the troop's real ledger with fictional
tents would be unrecoverable. `npx supabase db push`, which is what deploys to
production, never runs it.

### Resetting

```bash
npx supabase db reset       # wipe, re-apply migrations, re-seed
```

Fast and safe locally. This is the whole point of running the stack yourself —
you never have to clear the hosted database to try something.

---

## The invite flow

Members are invited from the Members tab and choose a password on
`/auth/set-password`. A member row and a login are separate things — most Scouts
never sign in — so the tab shows which members have one and offers **✉ Invite**
for those who do not. Only roles with `manages_members` see the button.

Sending an invitation needs the `service_role` key, which bypasses RLS and must
never reach a browser, so it goes through the `invite-member` Edge Function. The
function checks `can_manage_members()` for the caller and reads the address from
the database rather than trusting the request.

### Running it locally

```bash
npx supabase functions serve      # serves every function, hot-reloads
```

Invitations then work from the app, and the emails land in Mailpit
(http://127.0.0.1:54324). To skip the UI:

```bash
npm run invite -- priya@troop.test
```

That prints a ready-to-open link. Invite tokens are **single use**, so run it
again for a fresh one; it clears the pending auth user first, and refuses to run
against anything but a local stack.

### Deploying it

```bash
npx supabase functions deploy invite-member
npx supabase secrets set SITE_URL=https://your-production-domain
```

`SITE_URL` is where the invite link lands; without it the function falls back to
`http://localhost:5173`. `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set them.

`/auth/set-password` must also be in **Authentication → URL Configuration →
Redirect URLs**, or GoTrue quietly redirects to the Site URL instead and the
invitee lands in the app without a password.

---

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm test` | Unit tests (jsdom, no database needed) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:integration` | Integration tests — **needs the local stack up** |
| `npm run test:all` | Both suites |
| `npm run lint` | ESLint; CI fails on any error |
| `npm run build` | Production build to `dist/` |
| `npm run invite -- <email>` | Send a local invite |

CI runs lint, unit tests and the build on every push, plus the integration
suite against a stack it starts itself.

---

## Database changes

Schema lives in `supabase/migrations/`, applied in filename order.

```bash
# 1. write the migration
npx supabase migration new add_something

# 2. try it locally
npx supabase db reset

# 3. once it works, deploy
npx supabase db push
```

Write migrations by hand rather than editing tables in Studio — Studio changes
live only in your container and vanish on the next reset.

`db push` applies migrations to the **hosted** project. Check `npx supabase
migration list` first to see what is pending.

---

## Layout

```
src/
  Root.jsx              routing + session gate + the invite guard
  App.jsx               all app state and every mutation handler
  components/
    tabs/               one per top-level view
    modals/             one per action; each takes a fresh object from state
    elements/           small shared pieces (StoreroomMap, Toast, MemberSelect…)
  lib/
    supabase.js         the single client
    *.js                one module per table — the whole data layer
    selectors.js        pure derivations, unit-testable without rendering
supabase/
  migrations/           schema history
  seed.sql              local development data only
scripts/invite.mjs      local invite helper
tests/integration/      run against real Postgres
```

Two conventions worth keeping:

- **Derived state belongs in `lib/selectors.js`**, not inline in `App.jsx`. It
  is the difference between a test that renders the whole app and one that
  calls a function.
- **`lib/*.js` is the only place Supabase is called.** Components never import
  the client directly.

---

## Deploying

Push to `main` and Vercel builds Production. Any other branch gets a Preview
URL, which is *not* the live site — merge to `main` to actually ship.

`vercel.json` rewrites all paths to `index.html`. Without it `/auth/callback`
and `/auth/set-password` 404 on a hard load, because there is no router on the
server side.

Redirect targets must also be allow-listed in the Supabase dashboard under
**Authentication → URL Configuration**. Locally the equivalent lives in
`supabase/config.toml` under `additional_redirect_urls`.

---

## Troubleshooting

**`command not found: db`** — the `npx supabase` prefix is missing.

**`supabase start` hangs or errors** — Docker Desktop is not running.

**Integration tests all skip** — they detect an unreachable stack and skip
rather than fail. Run `npx supabase start`.

**Login returns 500, "Database error querying schema"** — a hand-inserted
`auth.users` row is missing columns GoTrue reads into non-nullable fields. Use
`npm run invite` or Studio rather than inserting auth users by hand.

**Changes not showing up** — see the `VITE_` environment variable warning above.

---

## Who may do what

Authorisation is enforced by Postgres, not by the UI. Every predicate requires
an **active** `members` row linked to the signed-in account, so an account with
no member row — or a member who has left — can see nothing.

| | items, stock, checkouts | members and roles | log |
|---|---|---|---|
| No member row | — | — | — |
| Scout, committee member | read | read | read |
| Quartermaster, assistant | **write** | read | append |
| Troop leader, assistant, scouter | **write** | **write** | append |

`public.roles` holds the vocabulary and the two capability flags. It has **no
write policy at all** — roles change by migration only, because a role table
anyone could edit would just move privilege escalation one table across.

`log` has no UPDATE or DELETE policy for anyone. Corrections mean appending an
entry, which is what a ledger has always meant.

## Known gaps

- For Check-In, the requester cannot also be the returner.
- Item images can be uploaded but not viewed in the item modal.
