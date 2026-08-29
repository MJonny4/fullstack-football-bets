-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('OPEN', 'CLOSED', 'SETTLED');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'RESOLVED');
CREATE TYPE "ScheduledDay" AS ENUM ('SAT', 'SUN');
CREATE TYPE "Market" AS ENUM ('MATCH_RESULT', 'EXACT_SCORE', 'TOTAL_CARDS', 'TOTAL_CORNERS');
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'WON', 'LOST');
CREATE TYPE "LedgerType" AS ENUM ('TOPUP', 'STAKE', 'PAYOUT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "coinBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_coinBalance_check" CHECK ("coinBalance" >= 0)
);

CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crestImageUrl" TEXT,
    "strengthRating" INTEGER NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Team_strengthRating_check" CHECK ("strengthRating" BETWEEN 1 AND 100)
);

CREATE TABLE "DTAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formation" TEXT,
    "tactics" JSONB,
    CONSTRAINT "DTAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "lifecycleKey" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "bettingClosesAt" TIMESTAMP(3) NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "scheduledDay" "ScheduledDay" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "resultPayload" JSONB,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Match_distinct_teams_check" CHECK ("homeTeamId" <> "awayTeamId")
);

CREATE TABLE "OddsSnapshot" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "market" "Market" NOT NULL,
    "selection" TEXT NOT NULL,
    "odds" DECIMAL(10,4) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OddsSnapshot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OddsSnapshot_odds_check" CHECK ("odds" >= 1.01)
);

CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "market" "Market" NOT NULL,
    "selection" TEXT NOT NULL,
    "stake" INTEGER NOT NULL,
    "oddsTaken" DECIMAL(10,4) NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "payout" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Bet_stake_check" CHECK ("stake" > 0),
    CONSTRAINT "Bet_oddsTaken_check" CHECK ("oddsTaken" >= 1.01),
    CONSTRAINT "Bet_payout_check" CHECK ("payout" IS NULL OR "payout" >= 0)
);

CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LedgerEntry_amount_check" CHECK ("amount" <> 0),
    CONSTRAINT "LedgerEntry_balanceAfter_check" CHECK ("balanceAfter" >= 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE UNIQUE INDEX "DTAssignment_userId_key" ON "DTAssignment"("userId");
CREATE UNIQUE INDEX "DTAssignment_teamId_key" ON "DTAssignment"("teamId");
CREATE UNIQUE INDEX "Round_weekNumber_key" ON "Round"("weekNumber");
CREATE UNIQUE INDEX "Round_lifecycleKey_key" ON "Round"("lifecycleKey");
CREATE INDEX "Round_status_bettingClosesAt_idx" ON "Round"("status", "bettingClosesAt");
CREATE INDEX "Match_roundId_status_idx" ON "Match"("roundId", "status");
CREATE INDEX "Match_status_scheduledAt_idx" ON "Match"("status", "scheduledAt");
CREATE UNIQUE INDEX "Match_roundId_homeTeamId_awayTeamId_key" ON "Match"("roundId", "homeTeamId", "awayTeamId");
CREATE INDEX "OddsSnapshot_matchId_market_selection_computedAt_idx" ON "OddsSnapshot"("matchId", "market", "selection", "computedAt" DESC);
CREATE INDEX "Bet_userId_createdAt_idx" ON "Bet"("userId", "createdAt" DESC);
CREATE INDEX "Bet_matchId_status_idx" ON "Bet"("matchId", "status");
CREATE UNIQUE INDEX "LedgerEntry_userId_reference_key" ON "LedgerEntry"("userId", "reference");
CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "LedgerEntry"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "DTAssignment" ADD CONSTRAINT "DTAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DTAssignment" ADD CONSTRAINT "DTAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OddsSnapshot" ADD CONSTRAINT "OddsSnapshot_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
