# Project overview and cross-cutting decisions

## Product vision

`fullstack-football-bets` is a fictional football league in which users can act
as team directors and participate in a virtual-coin betting economy. The product
is intentionally split into slices so that the accounts, economy, scheduling,
and settlement foundation can be exercised before a detailed match simulator is
introduced.

Known decomposition:

1. **Accounts and betting economy (this slice):** authentication, DT claims,
   weekly rounds, pre-match markets, virtual wallets, settlement, a live league
   table, and a performance-based bettor leaderboard.
2. **Player and squad domain:** player-level data needed by richer lineups and
   tactics. It is not part of this repository slice.
3. **Match simulation:** a real engine that consumes team/player/lineup data and
   replaces the weighted-random stub through the existing `ResultEngine`
   interface.

Later slices may expand the product, but they must not weaken the wallet,
settlement, or server-authoritative betting-window guarantees established here.

## Decisions that span slices

### League and DT control

- The league has 20 manually seeded fictional teams with varied strength from 1
  to 100.
- A round contains ten matches. The round-robin rotation ensures every team
  plays once per round and every pairing occurs once over 19 rounds.
- A season is 38 matchweeks: the second 19-week cycle reverses the home and away
  fixtures from the first cycle.
- Five weekly matches are assigned to Saturday and five to Sunday.
- A user may claim at most one team and a team may have at most one DT.
- Formation and tactics are stored now but do not affect the stub engine.

### League standings

- `GET /api/standings` derives the active season from the latest global week
  number and calculates the table from resolved matches in that 38-week window.
- A win awards three points and a draw one. Ordering is points, goal difference,
  goals scored, wins, normalized club name, then team ID for deterministic ties.
- Played, wins, draws, losses, goals for/against, goal difference, points, and
  the last five results are calculated on read. There is no mutable standings
  table to drift or double-count during settlement retries.
- A result counts as soon as its match resolves, even if the rest of that
  matchweek is still being played.

### Betting window and markets

- Betting opens with the round and closes Friday at 23:59 in `APP_TZ`.
- The API validates the round status and close timestamp on every bet. Client
  countdowns are presentation only.
- This slice supports single bets on 1X2, exact score, total cards, and total
  corners. There are no parlays or in-play bets.
- Exact scores cover 0-0 through 3-3 plus `OTHER`; total lines are 4.5 cards and
  9.5 corners.
- Odds derive from the same strength-based probability model used by the stub,
  with home advantage, a 6% house margin, and a 1.01 minimum.
- The accepted odds are copied onto the bet and never changed afterward.

### Coin economy and bettor leaderboard

- Signup grants 1,000 virtual coins. Opening a weekly round grants a flat 200
  coin top-up to every existing user.
- Every post-creation balance change goes through one wallet operation that
  updates the user and writes its ledger entry in the same transaction.
- Stakes are debited atomically; winning payout is `floor(stake * oddsTaken)`.
- Coins have no real-money value and cannot be purchased.
- Available balance remains visible, but it does not determine betting rank
  because signup grants, top-ups, and pending stakes would distort performance.
- One settled bet qualifies a manager. Rank is net profit descending, then ROI,
  settled-bet count, wins, account age, and user ID. Records remain marked
  provisional until five bets settle.
- Net profit is settled payout minus settled stake. ROI and hit rate exclude
  pending bets; pending count and stake are reported separately.
- Public rankings use a safe display alias and never return account emails.
- The league table and bettor leaderboard are broadcast over Socket.IO. Redis
  bridges worker live-data events after top-ups and every resolved result,
  including losing-only settlements that create no payout.

### Result engine and settlement

The stable replacement boundary is:

```ts
interface ResultEngine {
  resolve(match: MatchContext): Promise<MatchResultPayload>;
}
```

The slice-1 implementation is weighted-random and produces final score, cards,
and corners. Match settlement is idempotent: a conditional status transition
claims a match, and result persistence, bet grading, payouts, and ledger writes
complete atomically. Retrying an already resolved match is a no-op.

### Runtime and security

- TypeScript is used end to end in a pnpm workspace.
- PostgreSQL is authoritative; Redis supports BullMQ and pub/sub.
- Email/password authentication uses a bcrypt hash and JWT. OAuth, email
  verification, and payments are outside scope.
- The default timezone is `Europe/Madrid` and all stored timestamps are UTC.
- Dev lifecycle controls are environment-gated and must be disabled outside
  trusted local/demo environments.
- The expected scale is a single league and ordinary application traffic;
  correctness and clear replacement boundaries take priority over premature
  distribution.
