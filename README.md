# fullstack-football-bets

This is a self-contained virtual-coin football betting product for a fictional
20-team league. Users can create an account, explore every club and its
persistent 23-player squad, claim a team as DT, publish a position-aware XI,
and bet on weekly matches. Lineup changes recalculate team strength and open
odds, accepted prices remain locked, and eligible bets can be cancelled for a
full refund. Results come from a weighted-random stub behind the same
`ResultEngine` interface that the later simulation engine will implement.

## Stack

This is a TypeScript pnpm monorepo:

| Path | Purpose |
| --- | --- |
| `packages/shared` | Isomorphic domain types, markets, probabilities, odds, and bet grading |
| `packages/core` | Prisma, wallet invariants, scheduling, settlement, and the result-engine boundary |
| `apps/api` | NestJS REST API and Socket.IO gateway |
| `apps/worker` | BullMQ lifecycle scheduler and processors |
| `apps/web` | React, Vite, and Tailwind single-page application |
| `infra` | Docker build, Compose stacks, PostgreSQL initialization, and nginx |

The detailed decisions are in [docs/design](docs/design).

## Product features

- A 20-club, 38-matchweek double round-robin competition with a professional
  table: P, W, D, L, GF, GA, GD, points, and last-five form.
- A distinct bettor leaderboard ranked by settled net profit, with ROI, hit
  rate, W–L record, pending exposure, claimed club, and available coins.
- Responsive desktop tables and compact mobile views, including clear current
  manager/club, provisional-record, top-four, and bottom-three states.
- Live Socket.IO replacement snapshots for both tables, including settlements
  with no winner payout; production worker events cross Redis pub/sub.
- Public ranking payloads use manager aliases and do not expose account emails.
- URL-addressable public club profiles with locally bundled country flags,
  FIFA-style player attributes, usual XIs, alternative formations, and a
  paginated all-season match history.
- A private manager pitch for six formations, server-validated position
  penalties, draft saving, explicit publishing, and live rating calculation.
- Append-only odds revisions, own-team betting restrictions, audited
  cancellation refunds, and immutable XIs locked one hour before kickoff.

## Run the complete application

The only host dependency is Docker with Compose:

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up --build -d --wait
```

Open <http://localhost:8080>. The stack starts PostgreSQL, Redis, an idempotent
database migration/seed job, the API, the lifecycle worker, and nginx serving the
web app and proxying `/api` and `/socket.io`.

The Compose defaults are suitable only for a local demo. Change `JWT_SECRET` and
database credentials, and set `DEV_TOOLS=false`, before exposing the application.

To stop the services without deleting their data:

```bash
docker compose -f infra/docker-compose.yml down
```

### Demo a weekly lifecycle

With `DEV_TOOLS=true`, the API exposes local demonstration controls:

```bash
curl -X POST http://localhost:8080/api/dev/close-window
curl -X POST http://localhost:8080/api/dev/resolve-due
curl -X POST http://localhost:8080/api/dev/open-round
```

The normal worker schedule is Monday 09:00 to open a round and grant the weekly
top-up, Friday 23:59 to close betting, and a five-minute sweep to resolve due
Saturday/Sunday matches. Times use `APP_TZ`, which defaults to `Europe/Madrid`.

## Local development

Start only the stateful dependencies, then run each application on the host:

```bash
docker compose -f infra/docker-compose.dev.yml up -d --wait
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev:api
```

In separate terminals:

```bash
pnpm dev:worker
pnpm dev:web
```

The API listens on port 3000. Vite listens on port 5173 and proxies `/api` and
`/socket.io` to the API.

## Database commands

```bash
pnpm db:generate  # generate Prisma Client
pnpm db:migrate   # create/apply a migration during development
pnpm db:deploy    # apply committed migrations
pnpm db:seed      # idempotently seed teams and the initial round
```

The development Compose stack creates both `football` and `football_test`.
`pnpm db:test:deploy` applies committed migrations to the default local test
database. If you use different credentials, run the equivalent command with
`DATABASE_URL` set to your `TEST_DATABASE_URL`.

## Tests and validation

With the development Compose stack running:

```bash
pnpm typecheck
pnpm build
pnpm test
```

Individual suites:

```bash
pnpm --filter @fb/shared test
pnpm --filter @fb/core test
pnpm --filter @fb/api test
```

The integration suite uses `TEST_DATABASE_URL` and covers the HTTP lifecycle
against `football_test`. Unit suites cover probabilities/odds, market grading,
payout math, round-robin generation, season standings and tie-breakers, bettor
performance ranking, and the seeded statistical result-engine sanity check.

## Environment

See [.env.example](.env.example). Important settings are `DATABASE_URL`,
`TEST_DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `DEV_TOOLS`, `APP_TZ`,
`TOPUP_AMOUNT`, `INITIAL_COIN_BALANCE`, `CORS_ORIGIN`, and `PORT`.

## Deliberate implementation choices

- `packages/core` gives the API and worker one implementation of wallet and
  lifecycle invariants.
- A fresh seed opens round 1 so the application is immediately usable.
- The 20 team crests are served locally from normalized, transparent square
  assets; the identity data migration renames existing team rows in place so
  match and DT relationships keep their original IDs.
- Matches kick off at 17:00 local time and a due-work sweep is used instead of
  fragile, long-lived per-match delays.
- After the first 19-week round-robin cycle, pairings repeat with home and away
  orientation reversed to complete a 38-matchweek season. Standings reset at
  the next derived season boundary.
- League standings are calculated from resolved match results, avoiding mutable
  counters and remaining correct under concurrent/idempotent settlement.
- Betting rank uses settled net profit rather than balance; ROI and hit rate
  exclude pending bets, and records under five settlements are provisional.
- DT lineup data is intentionally free-form because player entities are outside
  this slice.
- Exact-score betting covers `0-0` through `3-3` plus `OTHER`; cards use 4.5 and
  corners use 9.5. Payouts floor to whole coins.
- Dev lifecycle endpoints are environment-gated and must be disabled publicly.
