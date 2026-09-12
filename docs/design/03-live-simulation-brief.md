# Live Simulation Design Brief

Status: approved direction implemented on `feature/live-match-simulation`.
The sections below retain the agreed design and its verification requirements.
Deployment is a separate step; this document does not imply a production rollout.

## Implementation Notes (updated 2026-09-12)

- Pure, checkpointed `touchline-v1` engine in `packages/core`, with 250 ms
  logical steps advanced in one-second watched or five-second unwatched batches. No final result exists
  before full time. Numeric state is quantized for exact PostgreSQL JSON replay.
- Atomic checkpoint/event/outbox persistence; concurrent advances use revision
  claims. Settlement consumes the saved result without a second random draw.
- Immutable 11-player starters and seven-player benches; five substitutions,
  three in-play windows, and halftime changes outside that window count.
  Fatigue, cards, injuries, and AI mentality affect subsequent actions.
- `/matches/:matchId/live` provides a responsive SVG pitch, player identities,
  match feed/history, live stats, major-event overlays, and read-only own bets.
  Socket room joins are acknowledged and retried after throttled reconnects.
- Audio is original procedural Web Audio ambience and event cues, not external
  recordings. It requires an explicit enable action and supports mute,
  background suspension, and cross-tab ownership.
- New rounds use fifteen-minute slots from 17:00 through 18:00 each day. The additive migration
  leaves existing fixtures, odds, and locks on the legacy engine unchanged.
- The development-only kickoff control closes its entire round before play.
  It cannot enable in-play betting or make the legacy resolver skip a match.
- Kickoff is automatic even with zero viewers, including recovery of missed
  Friday-close work. There is no start button on the match page.
- Redis audience leases choose delivery cadence; public snapshots use a bounded,
  short-lived single-flight cache. No viewer-dependent football decisions or
  private account data enter the cache.
- Per-match viewer counts and expiring local lease bookkeeping keep audience
  work bounded. Serialized room changes and request tokens prevent stale joins,
  failed snapshots, or disconnect races from reviving old subscriptions.
- Damped, speed-limited SVG motion runs at browser display cadence, preserving
  position and velocity between snapshots. Ball targets follow animated player
  positions; carriers no longer teleport to zone coordinates. Hidden tabs release
  their subscriptions and stop animation; reduced motion snaps to committed data.
- Reconnect catch-up does not replay historical shots. REST fallback refreshes
  results, private bets, wallet balances, and tables even with sockets blocked.
  Timeline requests are discarded when their match page is left.
- `pnpm verify:live` runs the complete code release checks. Calibration now fails
  on drift across all four markets, all six supported formations, and unequal
  strengths (8,000 seeded matches); tolerances and limitations are in the README.
- Human live management, manager-selected benches, persistent consequences,
  VAR, penalties, own goals, and abandonment are not implemented. The model
  caps player withdrawals/dismissals at the supported minimum of seven.

Verification commands and deployment precautions are in the root README.

## Approved Product Decisions

Deliver an exciting 2D match experience in roughly five real-world minutes.
The engine advances during play: possession, chances, goals, and the final
result emerge from the current state. The earlier proposal to precompute a
complete result and reveal a timeline is superseded.

- Use a dedicated 2D match center with animated pitch action, commentary,
  player attribution, live statistics, and major-event celebrations.
- AI handles tactics and substitutions in the first release. Human DT
  intervention during matches comes in a later slice.
- Substitutions affect active players, fatigue, team shape, and subsequent
  probabilities immediately.
- Injuries, fatigue, dismissals, and their availability consequences apply only
  to the current match initially. There are no carried injuries, accumulated
  bookings, or suspensions affecting the next fixture in this release.
- Betting closes Friday at exactly 23:59 in `APP_TZ`, currently
  `Europe/Madrid`. There is no betting or cancellation during simulation,
  halftime, stoppage time, or settlement. In-play betting is not a future
  extension proposed by this brief.
- Existing pre-match bets may appear as private, read-only reminders. Accepted
  odds and stakes remain unchanged; no cash-out or live repricing is offered.
- Match cards change from betting controls to a live scoreboard when playing,
  and to a recap after full time.
- Offer optional stadium audio with a remembered sound preference.
- Schedule five Saturday and five Sunday fixtures, with kickoff slots at least
  fifteen real minutes apart, starting at 17:00 each day.

## Matchday Schedule and Clock

The initial schedule is the same on Saturday and Sunday, in `APP_TZ`:

| Daily slot | Kickoff | Approximate full time |
| --- | --- | --- |
| 1 | 17:00 | 17:05 |
| 2 | 17:15 | 17:20 |
| 3 | 17:30 | 17:35 |
| 4 | 17:45 | 17:50 |
| 5 | 18:00 | 18:05 |

Generate slots independently for each day. Persist UTC kickoff timestamps and
set each lineup deadline to one hour before its own kickoff. Pairings and slot
assignments remain stable after round creation. Slot rotation across rounds is
a later fairness refinement.

The legacy implementation scheduled every fixture on a given day at 17:00.
The staggered policy applies only to new rounds; deployment leaves already-created
fixtures unchanged, including their accepted bets and existing lineup locks.

Five minutes is a pacing target, not an exact duration promise. A starting
tuning baseline is three real seconds per football minute, two 135-second
halves, and a 15-second halftime. Stoppage time extends those halves: six total
added football minutes would make play last about 303 real seconds. Settlement
latency is separate from the match clock.

Show first half, `45+N`, halftime, second half, `90+N`, and full time explicitly.
The engine calculates added time from interruptions, including injuries, goals,
cards, and substitutions. It announces added time at each half's normal end
without requiring knowledge of future events. Specify a bounded extension
policy during engine tuning so interruptions cannot prolong play indefinitely.

Scheduled kickoff anchors elapsed time. Matches advance even with no viewers.
Worker delays are recovered against that anchor rather than shifting every
remaining fixture. Staggering reduces ordinary overlap, but the implementation
must still handle concurrent recovery and overlapping matches safely.

## Existing Boundaries and Required Changes

The TypeScript workspace already provides React/Vite/Tailwind in `apps/web`,
NestJS and Socket.IO in `apps/api`, BullMQ in `apps/worker`, PostgreSQL/Prisma and
settlement in `packages/core`, and football/market logic in `packages/shared`.

Current matches transition from `SCHEDULED` directly to `RESOLVED`.
`ResultEngine.resolve(match)` returns a final `MatchResultPayload` containing
home/away goals, cards, and corners. Settlement atomically persists that result,
grades pending bets, and credits the wallet ledger. Preserve those guarantees.

Implementation must address these existing assumptions:

- `packages/core/src/settlement.ts` invokes the result engine before claiming a
  scheduled match. Live finalization must consume the persisted full-time
  result instead of generating a second one.
- `apps/worker/src/main.ts` currently resolves due matches, including on boot.
  Replace that path for live fixtures with start, advance, and finalize work.
  The legacy resolver and dev force-resolution endpoint must not bypass play.
- `apps/worker/src/jobs.ts` has a five-minute due sweep. Keep a recovery sweep,
  but use timely kickoff jobs and a separate cadence for active simulations.
- Current lineup snapshots preserve starting players and aggregate ratings,
  but do not freeze a bench or every individual attribute needed by the engine.
- Current tactics include private free-form data. Do not interpret manager
  notes as engine instructions; use validated, versioned tactical defaults for
  the initial AI and add publishable structured manager settings separately.
- The current Redis bridge rebroadcasts standings, leaderboard, and the entire
  round. High-frequency match updates require their own messages and rooms.
- The betting API checks the round deadline. Retain that check and also reject
  mutations for started/finished matches, including early demo kickoffs.

## Engine and Immutable Inputs

Keep the football engine pure and independent of sockets, database calls,
browser animation, and wall-clock timing. A possible boundary is:

```ts
interface LiveSimulationEngine {
  initialize(input: SimulationInput): SimulationState;
  step(input: SimulationInput, state: SimulationState): SimulationStep;
  finalize(state: SimulationState): MatchResultPayload;
}
```

`step` advances one configured logical interval and returns the next state and
events. `finalize` is only valid after full time. The worker decides how many
steps are due, then applies the same steps regardless of batching or retries.

Freeze every football input at the match's lineup deadline, using the last
eligible published lineup for recovered locks. The simulation input includes:

- Starting XI, seven-player bench, player IDs, display identities, shirt
  numbers, positions, adjusted ratings, and every attribute used by the model.
- Formation, ATT/MID/DEF/GK summaries, home advantage, and tactical defaults.
- Rules, tuning configuration, and engine version.

When initializing the simulation, create and persist a private random seed
once. Draws are reproducible from that seed and logical step/purpose counters,
or an equivalently persisted PRNG state. Changing commentary variants must not
change football outcomes. Never expose the seed or random state through public
DTOs; knowing them could let a client calculate future play.

Initialization must be idempotent and require complete immutable inputs. Do not
silently fall back to the club's current lineup if a historical snapshot is
missing. Preserve the pinned engine implementation for active matches across
deployments. Results and stored events remain the historical record.

## Football Model

Use possession and pitch zones as the initial level of detail:

```text
Possession → build-up → advance / turnover → chance → shot
                                                  ↓
                               miss / block / save / goal
                                                  ↓
                                  restart / rebound / corner
```

Passing, dribbling, defending, shooting, goalkeeper attributes, formation, and
home advantage influence those transitions. Score, remaining time, numerical
advantage, fatigue, and AI tactics change later decisions. Pitch participants
and ball locations must support what the commentary and renderer show.

Keep the first model bounded and explainable. Momentum should summarize recent
pressure, with any feedback effect explicitly limited. Do not add a comeback
bonus or force a dramatic ending. Presentation supplies excitement while the
engine allows quiet spells, draws, misses, and routine wins.

Generate goals, yellows, second-yellow dismissals, direct reds, corners,
offsides, fouls, shots, saves, substitutions, injuries, and phase events. Link
related events with an action ID and define one reducer that owns their stat
effects: a saved shot must not become three shots because `SHOT`,
`SHOT_ON_TARGET`, and `SAVE` each appear in the feed.

Use versioned commentary templates populated by committed event facts. Render
major incidents prominently and routine possession changes quietly. Avoid a
major alert every simulation tick.

VAR checks/overturns, penalties, own goals, and abandonment need explicit rule
handling before inclusion. They are not required for the initial approved
experience; do not emit decorative incidents that imply unsupported changes to
the score or match outcome.

## AI Substitutions, Tactics, and Match-Only Consequences

At lineup lock, choose seven eligible substitutes from the remaining squad,
including one goalkeeper and coverage for defensive, midfield, and attacking
roles. Freeze that bench with the starters. Manual bench selection can follow
later.

The proposed competition rule is up to five replacements, using at most three
in-play substitution windows. Halftime replacements count toward five players
but not toward the three windows. These are explicit application rules, and
must be encoded consistently in engine validation and the UI.

The AI considers fatigue, positional cover, card risk, injury, score, and time
remaining. A substitution updates the active XI and effective ratings before
the next action. If it changes formation, all remaining assignments must remain
valid. Goalkeeper replacement requires goalkeeper cover in this first version.

Use a documented model for fatigue: the existing player domain has `physical`
but no dedicated stamina attribute. Derived endurance, depletion, and halftime
recovery are tuning choices, not new player progression features.

Cards and injuries have immediate consequences. A dismissed player cannot act
or be replaced; an injured player may lose effectiveness or leave play. If no
legal replacement remains, a withdrawn player leaves the team short. Constrain
the initial incident rules to supported match states; define handling for a
team falling below the minimum playing count before allowing that state.

All these effects reset for the next fixture. Keep incidents in match history,
but do not alter persistent squad eligibility, published lineups, or future
match availability. Human DT commands during play are deferred; when added,
they will need authenticated, ordered commands and a clear offline fallback.

## Persistence, Lifecycle, and Recovery

Recommended implementation: keep `Match.status` as `SCHEDULED | RESOLVED` for
the settlement boundary and add `MatchSimulation` with phases
`PENDING | LIVE | HALFTIME | FINISHED`. Resolution remains authoritative on
`Match`; avoid a second independently mutable settlement flag.

Public responses derive the visible match phase from both records. `SCHEDULED`
alone must no longer mean that a match is awaiting kickoff. Update upcoming
fixtures, history, cards, and due-job queries accordingly.

`MatchSimulation` should hold:

- Unique `matchId`, immutable input, private seed, engine/config version.
- Phase, period, logical step, revision, and latest event sequence.
- Football clock, announced added time, and scheduled playback anchor.
- Score, statistics, possession duration, zones, active players, fatigue,
  discipline, AI tactics, and substitution usage.
- Last committed progress timestamp, finished timestamp, and a final payload
  that remains absent until full time.

`MatchEvent` should hold match ID, unique per-match sequence, action ID, logical
step, period, football timestamp, participants, type, typed payload, and commit
timestamp. Retain meaningful events and final inputs for history and audit;
storing every visual animation frame is unnecessary.

Start with a worker cadence around one real second, batching the due logical
steps. This is a tuning baseline rather than a promise of exact job timing.
Each advance atomically claims the expected revision, saves the new state,
appends events, and writes notification outbox entries. Conflicting attempts
reload and retry; they cannot commit duplicate goals or advance twice.

Viewer-aware delivery retains that one-second discovery cadence, but unwatched
matches only write a checkpoint when at least five real seconds are due. New
matches always initialize at their due kickoff; already-finished checkpoints
always attempt settlement. Joining restores normal cadence on the next tick.
The same logical steps run in both modes, with identical state, event ordering,
and final results. The savings are database writes, public snapshot reads, and
serialization, not a lower-fidelity result engine. Long outages still use bounded
catch-up batches rather than an unbounded synchronous simulation.

Each API maintains a lease per locally watched match in a shared Redis sorted
set. Lease lifetime is twelve seconds and renewal interval four seconds. Hidden
tabs unwatch, disconnects release presence, and REST-only readers have short
eight-second leases, renewed by five-second polling while disconnected. If the
worker cannot read presence it falls back to normal cadence; an API-only presence
outage can temporarily leave its matches at idle cadence without stopping play.
Snapshots are public-only, capped at 200 cached matches with a 750 ms TTL and
single-flight loads; invalidated in-flight reads cannot repopulate stale cache
entries. No-spectator updates avoid loading the detailed match/timeline.

Publish outbox messages after commit with retry. Clients deduplicate repeated
delivery. The recovery sweep finds missing kickoff work, stalled simulations,
unfinished finalization, and undelivered notifications. Database state is
authoritative even when queue jobs or socket messages are lost.

Recover elapsed play by executing the same logical steps, with bounded batches
so one overdue match does not monopolize the worker. An outage extending past
full time leads to deterministic catch-up and settlement. Clients receive the
current state and a missed-events summary rather than every missed animation.

## Settlement and Betting Guarantees

The lifecycle is:

1. Lock valid match inputs and initialize exactly once.
2. Advance play and publish committed state changes.
3. Commit full time and derive the final goals/cards/corners payload.
4. Atomically claim resolution, persist that payload on `Match`, grade pending
   bets, and credit payouts through the existing wallet operation.
5. Reconcile round completion once all matches are resolved and broadcast the
   confirmed standings, bet results, and balances.

No wallet action occurs because of a live goal or a projected bet outcome.
Finalization retries reuse the committed payload. Round-completion logic must
also converge when multiple matches resolve concurrently. Do not regenerate a
match to retry settlement.

The pre-match markets remain 1X2, exact score, cards over/under 4.5, and corners
over/under 9.5. Accepted prices stay immutable. The proposed card-count rule is
one for each yellow and each direct red; a dismissal following a second yellow
adds no third card. Keep yellows, direct reds, and dismissals distinct in the
engine, and document the counting rule alongside the market before rollout.

The current odds and result stub share a strength-based Poisson model. The new
engine needs a calibration gate: compare outcomes across many seeds, ratings,
formations, and AI decisions. Either demonstrate acceptable agreement with
existing pre-match pricing or derive new pre-match probabilities from separate
simulation samples. Those samples must never reuse the actual match seed or
preselect its final result. Define tolerances before enabling the new engine
for a newly priced round; do not silently change accepted market terms.

The API must enforce the Friday deadline on both placement and cancellation,
plus match eligibility. Early dev kickoff must close the relevant round before
starting play. Hiding controls is not authorization. Tests must include live
matches with a stale `OPEN` round and confirm zero bet/wallet/ledger mutations.

## API and Live Updates

Proposed REST endpoints:

- `GET /api/matches/:id/live`: public simulation snapshot, visible phase,
  revision, latest sequence, and server timing anchors.
- `GET /api/matches/:id/events?afterSequence=...`: paginated committed timeline.

Match viewers join scoped Socket.IO rooms. Publish `match:live:update`,
`match:event`, and `match:finished` with revision and sequence metadata. Send
small score/phase updates to the matchday board; do not recalculate standings
and broadcast every full round on each simulation tick.

Subscribe and establish a snapshot with a consistent sequence boundary so
updates arriving during the initial fetch cannot disappear. Ignore stale
snapshots and duplicate events; on gaps, reconnect, or returning from a
background tab, fetch current state and reconcile.

Public DTOs explicitly allow only display fields. Keep seeds, AI internals,
private notes, and other users' bets out of match rooms. Load the viewer's own
read-only bets through authenticated data, never a public match broadcast.

## Match Center, Cards, and Assets

Create `/matches/:matchId/live` with a responsive scoreboard, 2D pitch,
commentary, statistics, event timeline, and matchday ticker. The ticker now
primarily shows upcoming and completed fixtures, since kickoffs are staggered.
Support opening the same match after full time for its recap.

Use SVG pitch graphics and player markers as the initial rendering approach.
Interpolate formation movement, possession shifts, ball passes, and shot paths
between committed states. Keep animation local; network cadence and rendering
frame rate are separate. A small presentation buffer can align ball movement,
commentary, goal overlays, and score changes. Never predict a scoring event in
the browser or let decorative motion alter football state.

The football clock interpolates from server anchors within known phase bounds.
It must not invent halftime/full time when authoritative progress is stale.
Show connection recovery when needed. Reduced-motion mode keeps score and
commentary readable, and only the viewed match needs a fully animated pitch.

Transform the existing cards according to visible phase:

| State | Card presentation |
| --- | --- |
| Betting open | Existing markets, stake input, and betting controls |
| Closed, awaiting kickoff | Kickoff/countdown, markets closed, match-center link, own read-only bets |
| Live or halftime | Score, phase/clock, goalscorers, cards, latest event, pressure strip, watch action |
| Full time, settlement pending | Final score, recap, explicit settlement-pending label |
| Resolved | Confirmed result, recap link, own settled bet results |

During live play, remove actionable odds and stake controls. Read-only bet
reminders show the accepted selection and stake; any historical price is
clearly the accepted price. Never show a pending bet as paid or settled before
the settlement transaction commits.

Existing assets include 20 transparent 512x512 crests, club colors, nationality
flags, a generic 180x180 player silhouette, and CSS pitch/formation layouts in
`TeamProfilePage.tsx` and `TeamPage.tsx`. Reuse those identities and favor shirts,
numbers, and names over repeated generic portrait panels. New event icons and
pitch movement can be drawn in code. Stadium artwork is optional.

Audio needs new assets for ambience, attacks, saves, goals, and whistles. Keep
their source/licensing information with the files. Start silent, offer an
explicit enable/mute control, remember the preference, and handle audio start
being refused without affecting play. Avoid duplicate sound after reconnects
or in multiple open match tabs; suspend ambience when the page is hidden.

## Delivery Order and Verification

1. Define and validate immutable inputs, state transitions, event/stat rules,
   the match-only consequences, and competition-rule boundaries.
2. Build the pure engine and calibration harness. Tune player attributes,
   possessions, fatigue, tactics, injuries, and meaningful substitutions.
3. Add persistence, staggered scheduling, worker progression, outbox recovery,
   and settlement integration with early-resolution paths removed.
4. Add the match APIs, sequence-aware socket delivery, shared live data, and
   all card/profile/history/bet-page phase projections.
5. Build the 2D match center, commentary, celebrations, statistics, and optional
   audio. Exercise full matches and reconnects in the browser.
6. Verify rollout behavior for existing fixtures and accepted bets before
   enabling the engine for normal league play.

Release checks must cover:

- Same input/seed/version produces the same result across normal execution,
  different worker batch sizes, interruptions, and retries.
- A card, injury, or replacement affects future actions; inactive players
  cannot participate, and the next match begins without carried penalties.
- Each action contributes statistics once, player/team attribution is valid,
  possession display totals 100%, and the final timeline matches settlement.
  Goals from shots cannot exceed shots on target; unsupported own goals cannot
  bypass that rule.
- Event ordering remains correct across both halves and added time. Football
  timestamps and sequence numbers are distinct from commit timestamps.
- Each day's kickoff slots are at least fifteen minutes apart from 17:00 local,
  with correct timezone/DST conversion and per-match lineup deadlines.
- Concurrent kickoff/tick/finalization jobs cannot duplicate state, payouts,
  or ledger entries. Finished rounds eventually reconcile to settled.
- Betting and cancellation fail at and after Friday 23:59 and throughout all
  started match phases, without database side effects.
- Disconnects, stale snapshots, duplicate/out-of-order events, outbox retries,
  background tabs, and worker restarts cannot create divergent public scores.
- Desktop/mobile layout, reduced motion, sound permission failure, and repeated
  match navigation work without affecting engine time or settlement.

Tests inject time and advance logical steps without real sleeps. Statistical
tests run many complete matches quickly and use predefined tolerances rather
than asserting one dramatic score. Human live management, persistent injuries
and suspensions, full 3D, and in-play betting are outside this release.
