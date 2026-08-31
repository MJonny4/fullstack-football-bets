# Slice 2 Design: Team Profiles, Squads, and Dynamic Lineups

Status: implemented and verified.

## Scope

This slice turns the league's 20 seeded clubs into persistent football squads
with public club profiles. Every club receives 23 generated men's players, one
system-owned usual XI, and two alternative formations whether or not a user has
claimed it. A claimed club exposes a route into its private management area,
while the public profile remains the same read-only football view seen by other
users.

The slice also establishes the minimum official-lineup workflow needed for
football decisions to affect betting. A DT may maintain a private draft and
explicitly publish an official XI. Publishing recalculates the club's precise
strength and, while betting is open, appends new odds snapshots. Previously
accepted bets keep their locked price. Users may fully cancel pending bets
before the weekly betting deadline, but DTs may never bet on a match involving
their own club.

The existing weighted-random result engine remains in place. It consumes the
strength of the official XI locked one hour before kickoff; individual player
events and detailed simulation remain a later slice. The private management
area now provides a responsive pitch, formation picker, position-aware
substitutions, live rating calculations, private tactics, and distinct draft
and publish commands. Detailed training, roles, and simulation-facing tactical
instructions remain later work.

## Product rules

### Public club identity

- Every authenticated user may open any club profile at `/teams/:teamId`.
- A club identity is navigable from match headers, desktop and mobile league
  tables, bet history, the bettor leaderboard, and team selection.
- Team names used as betting outcome buttons remain betting controls; a link is
  never nested inside another interactive control.
- The public profile shows the crest, club metadata, current precise strength,
  season record, recent form, upcoming fixtures, paginated all-season match
  history, the public official XI, alternative lineup summaries, and the
  complete squad.
- The current DT sees the same profile plus a prominent **Manage club** action.
- Other users never receive private drafts, unpublished lineups, free-form
  manager notes, account email addresses, or internal manager identifiers.

### Squads

- Each club has exactly 23 persistent players in this slice.
- The default position allocation is three goalkeepers, eight defenders, eight
  midfield/wide players, and four forwards.
- Each player has one primary position and zero through two secondary
  positions.
- Shirt numbers are unique within a club.
- Players remain with their generated club. Transfers, loans, releases,
  contracts, academies, and roster turnover are out of scope.
- Player ratings and attributes do not develop or decline in this slice.
- All players use the same local fallback portrait unless a future player image
  URL is supplied. The fallback asset is `/players/default-player.png`.

### System and manager lineups

- Unclaimed clubs always retain a valid system-generated official XI.
- Each club starts with one primary usual XI and two distinct alternative
  formations selected from `4-3-3`, `4-2-3-1`, `4-4-2`, `3-5-2`, `3-4-3`, and
  `5-3-2`.
- A club claim does not erase or replace any system lineup.
- A manager draft is private and has no effect on public data, team strength,
  odds, or match resolution.
- Only an explicit **Publish official XI** action changes the club's public
  lineup.
- An incomplete or invalid draft cannot be published. The last valid official
  XI continues to apply.
- Re-publishing an effectively identical XI is a no-op and creates no odds
  snapshots or duplicate live events.
- Alternative formations are public previews. They have their own OVR, ATT,
  MID, DEF, and GK summaries but do not affect betting until made official.

## Weekly timeline and authority

All timestamp decisions are server-authoritative and use stored UTC timestamps
derived from `APP_TZ`. Client countdowns are presentation only.

| Period | Lineup behavior | Odds behavior | Bet behavior |
| --- | --- | --- | --- |
| Monday open through Friday 23:59 | A DT may publish an official XI | A changed official strength appends current odds snapshots | Users may place or fully cancel bets |
| Friday 23:59 through one hour before kickoff | A DT may still publish late football changes | The closed market is not repriced | Accepted bets are frozen and cannot be cancelled |
| One hour before kickoff | The match snapshots both official XIs and strengths | No market changes | No bet changes |
| After lineup lock | Edits may be saved for future matches only | No effect on the locked match | No effect on the locked match |
| Kickoff and resolution | The engine consumes the locked strengths | Historical odds remain immutable | Pending non-cancelled bets settle normally |

The current weekly betting deadline remains Friday at 23:59 in `APP_TZ`. For a
match scheduled at 17:00, its official lineup deadline is 16:00. A publish
request at or after the exact lineup deadline cannot alter that match.

A late illness, absence, or tactical decision may therefore change the XI
after betting closes but before the one-hour lineup deadline. Bettors accept
that football risk: their price remains the one accepted earlier, the market
does not reopen, and no refund is created.

The worker's five-minute due-match sweep also performs idempotent lineup locks,
and the boot-time recovery sweep catches missed deadlines. A publish after a
deadline remains useful for future fixtures but cannot alter that match: a
recovered lock selects the last valid official lineup published strictly before
the stored deadline. Settlement ensures a due snapshot exists before invoking
the result engine.

## Data model

The exact Prisma names may vary where relation metadata requires it, but the
following domain fields and constraints are required.

### Team

The existing `Team` gains public profile metadata and a derived precise rating:

- Immutable URL slug and three-letter abbreviation.
- Short name, fictional city, stadium name, and founded year.
- Primary, secondary, and shirt-text colors stored as validated hex colors.
- `strengthRating` represented with at least two-decimal precision.
- A reference to the current official lineup, or an equivalent uniqueness
  invariant guaranteeing one official lineup per team.
- Relations to players, lineups, and match lineup snapshots.

Existing team IDs, match relations, DT claims, and crest URLs are preserved.
The target displayed club range is approximately 60 through 85. The database
continues to reject ratings outside the supported football scale.

### Player

`Player` contains:

- ID and owning team ID.
- First name and last name.
- ISO 3166-1 alpha-2 nationality code.
- Unique shirt number within the team.
- Primary position and zero through two secondary positions.
- Whole-number overall rating from 1 through 99.
- Optional future image URL; null uses the shared local fallback.
- For outfield players: pace, shooting, passing, dribbling, defending, and
  physical, each from 1 through 99.
- For goalkeepers: diving, handling, kicking, reflexes, speed, and positioning,
  each from 1 through 99.

Outfield players must have a complete outfield attribute set and no goalkeeper
attribute set. Goalkeepers must have a complete goalkeeper attribute set and no
outfield attribute set. Database checks backstop service validation.

Supported primary and secondary positions are:

```text
GK
RB CB LB
CDM CM CAM
RM LM RW LW
ST
```

Goalkeepers may only occupy the goalkeeper lineup slot in this slice, and an
outfield player may not occupy it.

### Team lineup and slots

A team lineup contains:

- Team ID, public label, formation, source (`SYSTEM` or `MANAGER`), and public
  or private/draft state.
- Creation, update, and optional publication timestamps.
- Eleven ordered lineup slots when valid.
- A marker or team-owned reference identifying the single official lineup.

Each lineup slot contains its formation slot key, assigned player, and unit
group (`GK`, `DEF`, `MID`, or `ATT`). A valid published lineup has exactly 11
different players from the same team, exactly one goalkeeper in goal, and one
assignment for every slot required by its formation template.

### Match lineup snapshot

Each match has at most one home and one away lineup snapshot. A snapshot stores:

- Match, team, and side (`HOME` or `AWAY`).
- Source lineup and formation.
- Lineup deadline and actual lock timestamp.
- Precise OVR, ATT, MID, DEF, and GK values used.
- Eleven immutable player-slot records containing player ID, source overall,
  assigned slot, applied position penalty, and adjusted rating.

The snapshot is the audit record for what the engine used. Later edits to a
team's current lineup cannot alter an existing snapshot or explain a historic
result differently.

### Bet and ledger changes

`BetStatus` gains `CANCELLED`, and `Bet` gains a nullable `cancelledAt`.
`LedgerType` gains `REFUND`.

Cancellation is a domain transition, never a database deletion. A successful
cancel operation atomically:

1. Confirms the bet belongs to the authenticated user and is still `PENDING`.
2. Confirms the round is `OPEN` and `now < bettingClosesAt`.
3. Changes the bet to `CANCELLED` and records `cancelledAt`.
4. Returns the full original stake through the wallet operation.
5. Writes one positive `REFUND` ledger entry with idempotency reference
   `bet:<betId>:refund`.

Repeated or concurrent cancellation attempts cannot refund twice. Cancelled
bets are excluded from settlement, pending totals, settled metrics, ROI, hit
rate, profit, and ranking qualification. They remain visible in bet history as
cancelled and refunded.

## Identity and squad generation

The supplied 1,000-record identity dataset is copied into a versioned repository
data file. Its `first_name` and `last_name` pairs form the deterministic identity
pool. Its original nationality codes are deliberately ignored: generated
players receive nationalities from a curated European-only weighted ISO array.

The European pool favors the larger football populations without excluding a
reasonable long tail. It includes codes from this set, with explicit weights in
source control:

```text
ES FR PT GB DE IT NL BE HR RS PL DK SE NO CH AT
CZ SK SI RO BG GR IE IS FI UA HU AL BA ME MK CY
```

The generator uses a source-controlled generation version and a deterministic
random source keyed by immutable team identity. It selects 460 unique identities
and produces the same data for the same generation version on a clean database.
Database restarts and repeated seed commands do not reshuffle or overwrite
existing players, shirt numbers, attributes, formations, manager drafts, or
published lineups.

For each team, generation proceeds in this order:

1. Map the old 30-through-88 ordering into an approximate 60-through-85 target
   band while preserving club order.
2. Generate a position-balanced 23-player roster around that target.
3. Generate position-shaped attributes and calculate overall from those
   attributes using position-specific weights.
4. Allow controlled outliers up to 92 so a weaker club may contain an
   exceptional player without making the full XI elite.
5. Generate three viable distinct formations and choose their best compatible
   XIs.
6. Select one as the system official usual XI and derive the final precise team
   strength from it.

The generator tunes the surrounding squad so the derived official strength
remains close to the club target. It does not generate overall as an unrelated
seventh statistic. Generation tests verify bounds, coverage, determinism,
identity uniqueness, and the intended distribution of club and star ratings.

## Rating and position calculations

Player attributes and overall are whole numbers, while lineup and team values
use two-decimal internal precision. The UI may round OVR for a familiar card
presentation, but probability and odds code consumes the precise value.

The official lineup OVR is the arithmetic mean of all 11 adjusted player
ratings. Replacing a 76-rated starter with an 88-rated player therefore raises
the lineup by approximately `12 / 11 = 1.09`, subject to position fit.

Unit scores are arithmetic means over the formation slots in that unit:

- ATT averages players assigned to attacking slots.
- MID averages players assigned to midfield slots.
- DEF averages players assigned to defensive slots.
- GK is the adjusted goalkeeper rating.

A one-striker formation calculates ATT from that one attacking slot; it does
not invent extra players or apply a unit-size correction.

Position compatibility is an explicit shared, directional matrix rather than a
distance guessed by the UI:

- Natural position: no penalty.
- Very close role, such as ST to a compatible wide-forward role: typically
  minus 1.
- Related or adjacent role: typically minus 2 or minus 3.
- Clearly inappropriate outfield role, such as ST at CB: minus 5.
- Goalkeeper/outfield swaps: invalid rather than penalized.

Every formation template, slot group, compatibility value, and adjusted-rating
calculation lives in shared pure code and is unit tested. The server repeats all
validation and never trusts client calculations.

## Dynamic strength and odds

At round opening, odds use each club's current precise official-lineup strength.
While the round remains open, publishing a materially different official XI
atomically:

1. Validates and publishes the lineup.
2. Recalculates and stores the team's precise OVR and unit values.
3. Finds the team's scheduled match in the current open round.
4. Recalculates every supported market using both teams' latest strengths.
5. Appends a complete new set of `OddsSnapshot` rows.
6. Commits before emitting team and round replacement snapshots.

It never updates an existing odds snapshot and never changes `Bet.oddsTaken`.
A user who keeps a Monday bet receives the Monday price even if Thursday's
current price changes. A user who cancels and places a new bet receives the
latest current price.

Publishing after the Friday betting deadline may still update the public team
profile and future official lineup, but it creates no odds for the closed
market. The match uses the final official XI captured at its one-hour lock.

Concurrent lineup publishes, bet placements, cancellations, round closure, and
match locking use serializable transactions or equivalent conditional writes
with bounded retry. A client must never observe a published team strength whose
corresponding current odds failed to commit.

## Betting integrity

A DT cannot place a bet on a match in which their claimed club is either the
home or away team. The current-round match DTO exposes a derived presentation
flag such as:

```ts
canBet: false
bettingRestriction: "OWN_TEAM"
```

This flag supports the UI but is not the security boundary. The bet placement
transaction independently checks the user's current DT assignment against both
match teams.

A user cannot claim a team while holding a pending bet on any match involving
that team. Before the betting deadline the user may cancel those bets first;
after the deadline the claim remains unavailable until those bets settle. This
prevents placing a bet and only then acquiring lineup control.

Multiple bets on the same match or market remain allowed. Each is independently
priced, cancellable before the deadline, and settled. Partial cancellation,
cash-out pricing, cancellation fees, and cancellation after the weekly deadline
are out of scope.

## API contracts

All squad and team-profile endpoints remain authenticated in this slice.

### Public team endpoints

- `GET /api/teams` returns privacy-safe summaries only. It does not return DT
  user IDs, emails, private tactics, notes, drafts, or full squads.
- `GET /api/teams/:id` returns the public club profile or HTTP 404.
- `GET /api/teams/:id/history` returns resolved matches newest first in pages
  of ten. Its opaque cursor loads older matches without duplicating entries.
- The detail response contains team metadata, `isMine`, a safe manager alias or
  unclaimed state, current precise/display strength, current-season standing,
  public official lineup and players, two alternative summaries, the public
  squad, recent results, and upcoming fixtures.

Player responses are a discriminated outfield/goalkeeper shape so consumers do
not receive meaningless nullable statistics as if they applied to every player.
Numeric Prisma decimals are explicitly mapped to JSON numbers at the API
boundary.

### Private team endpoints

- `GET /api/teams/me` includes the manager's draft and private tactics.
- `PUT /api/teams/me/draft` validates and saves a private XI without publishing
  or repricing.
- `POST /api/teams/me/publish` validates the complete XI, updates the official
  lineup and strength, appends open-market odds, and returns the committed
  private profile.
- Existing lightweight `DTAssignment.formation` and `tactics` data is migrated
  without publishing free-form notes.

The legacy `PUT /api/teams/me/lineup` command remains the private tactical-notes
save boundary; it does not publish the player XI.

### Bet cancellation

- `DELETE /api/bets/:id` performs the audited cancellation transition and
  returns the cancelled bet, refund amount, and new coin balance.
- A bet owned by another user returns HTTP 404 rather than disclosing its
  existence.
- A non-pending bet or closed cancellation window returns HTTP 409 without any
  writes.

### Live replacement events

The API sends complete replacement payloads after commit:

- `round:update` after an open-market odds change.
- `team:update` for an affected public club profile.
- `leaderboard:update` after a refund changes a wallet or bettor pending totals.

The round contains only ten matches, so replacement snapshots are preferred to
fragile client-side patches. Worker-originated lineup locks and any related
updates travel through the existing Redis bridge when a browser-visible payload
changes.

## Web application

The web application adopts URL routing with these authenticated routes:

```text
/matches
/standings
/bets
/leaderboard
/my-team
/teams/:teamId
```

The root route redirects to `/matches`. Browser refresh, bookmarking, forward,
and back navigation work on team profiles. nginx's existing SPA fallback
continues to serve direct route requests.

A shared semantic team-link component wraps the crest and name where navigation
is appropriate. It provides keyboard focus and an accessible club name without
turning the presentational crest component itself into an unconditional link.

The public profile layout contains:

1. Club hero with crest, name, metadata, current rating, table position, form,
   DT state, and conditional **Manage club** action.
2. A responsive pitch showing the official XI through shirt number and surname.
3. A selected-player panel containing fallback portrait, flag, nationality,
   position, OVR, and the correct six outfield or goalkeeper attributes.
4. Two compact alternative lineup cards containing formation, OVR, ATT, MID,
   DEF, and GK.
5. A complete squad grouped by goalkeepers, defenders, midfielders, and
   forwards.
6. Recent results and upcoming fixtures.

The same profile renders for the user's own and other clubs; edit controls are
only reachable for the current DT. Long names, accented characters, unavailable
crest/player images, mobile pitch layout, loading, 404, and API error states all
have explicit fallbacks.

The My Bets page shows accepted odds permanently. A cancellable pending bet has
an explicit full-refund action until the server deadline. Cancelled bets remain
in history with their refund state rather than disappearing.

Country flags are bundled local SVG assets keyed by lowercase ISO code, with a
text country name as the accessible label and a neutral fallback for an unknown
code. The application does not depend on an external flag service.

## Migration and deployment

The change is additive and preserves all existing IDs, claims, matches, bets,
ledger entries, odds snapshots, and resolved results.

Implementation separates schema migration from deterministic data backfill:

1. Apply enums, tables, relations, indexes, decimal rating support, and manual
   database checks.
2. Run the versioned idempotent seed/backfill before API and worker startup.
3. Add missing club metadata, players, system lineups, and official lineup
   references without replacing rows already created for the same generation.
4. Recalculate team strengths from official XIs.
5. For unresolved matches in an open round, append fresh odds snapshots using
   the new strengths. Existing bet prices remain untouched.

The current seed behavior that overwrites static `strengthRating` values on
every run must be removed. A normal container restart may fill genuinely
missing generated records but must never reshuffle or overwrite a complete
roster or manager-owned data. A generation-version change is an explicit data
migration, not an environment-variable surprise.

API and worker startup already wait for database setup in Docker Compose, which
prevents them from resolving matches or accepting bets during the deployment
backfill. Non-Compose deployment documentation must preserve the same ordering.

The supplied player-identity data is reviewed before committing for unsuitable
or duplicate identities. The third-party fallback portrait may be used for
local development; redistribution permission must be confirmed or the asset
replaced with an owned equivalent before a public/commercial release.

## Testing

### Pure unit tests

- Identity selection and squad generation are deterministic for a generation
  version and produce 20 distinct 23-player squads.
- Every generated nationality belongs to the European allowlist.
- Shirt numbers, identity usage, attribute ranges, goalkeeper/outfield shapes,
  position coverage, primary/secondary positions, and rating bounds hold.
- Generated club strengths remain approximately 60 through 85 while controlled
  individual stars may reach 92.
- All formation templates contain 11 unique valid slots and generated clubs can
  field every assigned system formation.
- Position compatibility, directional penalties, adjusted ratings, unit
  averages, precise OVR, and rounding boundaries are exact.
- Probability and odds monotonicity remain valid with decimal strengths and the
  compressed club range.
- Seeded statistical tests establish the intended upset range and ensure the
  strongest club does not deterministically dominate simulated seasons.

### API and core integration tests

- Repeated seeds preserve player IDs, assignments, ratings, lineups, and manager
  data and create no duplicates.
- Team summaries and details expose only approved public fields; private drafts,
  tactics, user IDs, and email addresses never leak.
- Detail responses return the correct squad, official XI, alternatives,
  standing, recent results, fixtures, and HTTP 404 behavior.
- Match history returns every season newest first, paginates without overlap,
  and rejects cursors that do not belong to the requested club.
- A valid pre-deadline publish updates official lineup and precise strength,
  appends exactly one complete odds revision, and broadcasts replacement data.
- An unchanged publish is a no-op.
- Existing bets retain their exact `oddsTaken`; new bets receive the latest
  odds.
- Publishing after Friday changes no closed-market odds, while publishing
  before the one-hour match deadline changes the lineup later captured for the
  match.
- Publishing at or after the lineup deadline cannot alter that match snapshot.
- Lineup locking and boot recovery are idempotent under repeated or concurrent
  work.
- DTs cannot bet on their club's matches, including concurrent claim/place
  attempts.
- A user with an involving pending bet cannot claim that club.
- A pre-deadline cancellation records `CANCELLED`, refunds the exact stake once,
  and updates wallet, ledger, pending totals, and live data atomically.
- Late, settled, lost, won, cancelled, foreign-user, repeated, and concurrent
  cancellation attempts produce the correct status without duplicate refunds.
- Cancelled bets are never graded and never affect settled leaderboard metrics.
- Concurrent lineup publish, bet placement, cancellation, round closure, match
  lock, and settlement preserve all wallet and football invariants.

### Web and manual verification

- Direct route entry, refresh, back, and forward navigation work for all routes.
- Every non-betting team identity opens the correct club profile by team ID.
- Desktop and mobile profiles render the pitch, player selection, flags,
  attributes, alternative summaries, squad, fixtures, and ownership action.
- Own-team markets visibly explain why betting is unavailable while the API
  remains the enforcement boundary.
- A published lineup replaces public data and open odds without requiring a
  full browser reload.
- Bet history preserves accepted odds and supports one full refund
  before, but never at or after, the server deadline.
- The complete existing signup, claim, bet, cancel, settle, standings, and
  leaderboard flows remain manually demonstrable.

## Explicitly out of scope

- Transfers, loans, contracts, releases, academies, and multi-season roster
  changes.
- Injuries, suspensions, fitness, morale, fatigue, age, development, and rating
  changes.
- Player-specific goals, assists, appearances, cards, corners, match ratings,
  or leaderboards before the detailed simulator exists.
- Unique generated player portraits or remote image/flag services.
- Advanced Football Manager-style training, player roles, detailed tactical
  instructions, fitness, and squad-planning tools beyond the delivered XI
  editor.
- Automated AI managers changing unclaimed-club lineups after generation.
- Partial cancellation, cash-out, cancellation fees, parlays, in-play betting,
  and cancellation after Friday's deadline.
- Real-money behavior or weakening any wallet, settlement, privacy, or
  server-authoritative deadline guarantee from Slice 1.
