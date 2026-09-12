# fullstack-football-bets

This is a self-contained virtual-coin football betting product for a fictional
20-team league. Users can create an account, explore every club and its
persistent 23-player squad, claim a team as DT, publish a position-aware XI,
and bet on weekly matches. Lineup changes recalculate team strength and open
odds, accepted prices remain locked, and eligible bets can be cancelled for a
full refund before the betting deadline. New fixtures use a real-time,
server-authoritative simulation with a 2D match center. Existing fixtures keep
their original weighted-random engine and accepted odds.

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
- Five-minute live matches with animated 2D pitches, commentary, statistics,
  AI substitutions, match-only fatigue/injuries/cards, and optional sound.
- Persisted simulation checkpoints, reconnect recovery, and exactly-once
  settlement. Betting and cancellation are never available during live play.

## Run the complete application

The only host dependency is Docker with Compose:

```bash
cp .env.example .env
docker compose --env-file .env -f infra/docker-compose.yml up --build -d --wait
```

Open <http://localhost:8080>. The stack starts PostgreSQL, Redis, an idempotent
database migration/seed job, the API, the lifecycle worker, and nginx serving the
web app and proxying `/api` and `/socket.io`.

The Compose defaults are suitable only for a local demo. Change the database
credentials, set `DEV_TOOLS=false`, use HTTPS with `COOKIE_SECURE=true`, and
configure email delivery before exposing the application.

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

Normal matches start automatically at their scheduled kickoff, with or without
viewers. The match page has no start button. For an explicit developer-only
early-kickoff diagnostic (never on production), the API still supports:

```bash
curl -X POST http://localhost:8080/api/dev/matches/MATCH_ID/kickoff
```

This closes betting for that fixture's entire round, freezes its lineups, and
starts the normal live engine early. Keep the worker running. Prepare demo bets
before kickoff; they remain read-only until full-time settlement. The legacy
`resolve-due` control does not skip or resolve live simulations.

The normal worker schedule is Monday 09:00 to open a round and grant the weekly
top-up and Friday 23:59 to close betting. Each weekend day has five kickoffs at
17:00, 17:15, 17:30, 17:45, and 18:00. A one-second worker tick discovers kickoffs
and advances watched matches; unwatched matches batch five seconds of the same
football simulation. The five-minute sweep handles lineup locks and legacy results. Times
use `APP_TZ`, which defaults to `Europe/Madrid`.

### Viewer-aware delivery and smooth playback

- Idle mode reduces checkpoint/event write batches to one fifth of the normal
  cadence. It does not skip football steps or change probabilities, seeds,
  outcomes, or betting rules. Results still settle with nobody watching (within
  the idle cadence plus worker latency).
- API instances publish short-lived Redis audience leases, renewed every four
  seconds. Leaving the match or hiding the tab releases the socket subscription;
  short REST-reader leases also support clients with blocked WebSockets.
  Viewer counts are tracked per match, and expired local lease records are
  discarded. Slow room joins or snapshot reads cannot revive an old subscription.
- Opening a match promotes it on the next worker tick. If the worker cannot read
  presence, it falls back to normal progression. If an API loses its presence
  connection, matches keep progressing at idle cadence until leases recover;
  API crashes cannot retain stale viewers forever.
- A bounded 750 ms public-snapshot cache shares simultaneous reads and is
  invalidated by committed updates. No private bets, balances, or sessions are
  cached there. With no match viewers, the API skips detailed timeline reads and
  serialization; matchday boards receive compact summaries only.
- SVG movement runs locally at display cadence, with damped, speed-limited
  player movement and ball flight/rolling. Carriers move within their team shape
  instead of teleporting to random ball coordinates. Animation pauses in hidden
  tabs and on stale feeds; reduced-motion mode uses static committed positions.
- Reconnecting catches up to current play without replaying historical shots.
  Polling also repairs settled bets, tables, and wallet balances if socket
  delivery is unavailable or a settlement update was missed.
- Already-created fixtures retain their schedules and engine version. The
  fifteen-minute policy applies to newly created rounds only.

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
pnpm test:calibration
pnpm exec playwright install --with-deps chromium
pnpm test:browser
```

The integration suite uses `TEST_DATABASE_URL` and covers the HTTP lifecycle
against `football_test`. Unit suites cover probabilities/odds, market grading,
payout math, round-robin generation, season standings and tie-breakers, bettor
performance ranking, and the seeded statistical result-engine sanity check.
Live tests cover deterministic database recovery, concurrent advancement and
settlement, immutable benches, private-state projection, forbidden live betting,
and outbox retries. Browser tests run desktop and mobile against an isolated
`football_test` schema (`live_browser`) on ports 3100/5180, including reloads,
halftime, hidden tabs, denied audio, reduced motion, slow timeline navigation,
and settled bets/wallets with blocked sockets. They do not use the development
or complete-app databases. Developer lifecycle endpoints are tested as disabled
with zero league mutations when `DEV_TOOLS=false`.

`pnpm test:calibration` is a pass/fail release gate: 1,000 seeded matches in each
of eight scenarios (equal-strength teams in all six formations, plus strong/weak
home and away matchups). It checks every priced market, including exact scores,
against the existing probability model. Absolute tolerances are 0.08 for result
and totals probabilities, 0.04 for exact-score probabilities, 0.3 mean goals per
side, 0.6 mean total cards, and 1.0 mean total corners. These are regression
limits, not a guarantee of exact pricing for every squad. Failed checks exit
nonzero; samples never use a real fixture's seed or modify league data.

After installing Chromium and its dependencies, `pnpm verify:live` runs
typechecking, production builds, unit/integration tests, calibration, and browser
tests together. Allow several minutes for the 8,000-match calibration run.

### Live simulation rollout

Apply `20260911000100_live_simulation` before starting the updated API and
worker. Back up an existing deployment first. The migration is additive:
already-created fixtures retain their schedules, lineup locks, accepted odds,
and legacy engine. Only new rounds opt into `touchline-v1` and staggered slots.
Do not convert fixtures with accepted bets or invoke demo controls in a real
production league. Rebuild the API, worker, and web together, and keep the
pinned engine implementation while any of its matches remain active.

## Environment

See [.env.example](.env.example). Important settings are `DATABASE_URL`,
`TEST_DATABASE_URL`, `REDIS_URL`, `DEV_TOOLS`, `APP_TZ`, `APP_PUBLIC_URL`,
`COOKIE_SECURE`, `SESSION_TTL_DAYS`, `EMAIL_NAME`, `EMAIL_PASSWORD`,
`TOPUP_AMOUNT`, `INITIAL_COIN_BALANCE`, `CORS_ORIGIN`, and `PORT`.

## Deliberate implementation choices

- `packages/core` gives the API and worker one implementation of wallet and
  lifecycle invariants.
- A fresh seed opens round 1 so the application is immediately usable.
- The 20 team crests are served locally from normalized, transparent square
  assets; the identity data migration renames existing team rows in place so
  match and DT relationships keep their original IDs.
- Matches kick off from 17:00 local time and due-work sweeps are used instead of
  fragile, long-lived per-match delays.
- After the first 19-week round-robin cycle, pairings repeat with home and away
  orientation reversed to complete a 38-matchweek season. Standings reset at
  the next derived season boundary.
- League standings are calculated from resolved match results, avoiding mutable
  counters and remaining correct under concurrent/idempotent settlement.
- Betting rank uses settled net profit rather than balance; ROI and hit rate
  exclude pending bets, and records under five settlements are provisional.
- Structured XI assignments and player attributes are frozen at lineup lock.
  Free-form manager notes are not interpreted as live engine commands.
- Exact-score betting covers `0-0` through `3-3` plus `OTHER`; cards use 4.5 and
  corners use 9.5. Payouts floor to whole coins.
- Dev lifecycle endpoints are environment-gated and must be disabled publicly.
