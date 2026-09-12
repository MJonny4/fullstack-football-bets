CREATE TYPE "SimulationPhase" AS ENUM ('PENDING', 'LIVE', 'HALFTIME', 'FINISHED');
ALTER TABLE "Match" ADD COLUMN "simulationVersion" TEXT;
ALTER TABLE "MatchLineupSnapshot" ADD COLUMN "simulationTeam" JSONB;

CREATE TABLE "MatchSimulation" (
  "matchId" TEXT NOT NULL PRIMARY KEY,
  "version" TEXT NOT NULL,
  "seed" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "state" JSONB NOT NULL,
  "phase" "SimulationPhase" NOT NULL DEFAULT 'PENDING',
  "step" INTEGER NOT NULL DEFAULT 0 CHECK ("step" >= 0),
  "revision" INTEGER NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
  "lastSequence" INTEGER NOT NULL DEFAULT 0 CHECK ("lastSequence" >= 0),
  "startedAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "finalPayload" JSONB,
  CONSTRAINT "MatchSimulation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MatchSimulation_full_time_check" CHECK (("phase" = 'FINISHED') = ("finalPayload" IS NOT NULL AND "finishedAt" IS NOT NULL))
);
CREATE INDEX "MatchSimulation_phase_updatedAt_idx" ON "MatchSimulation"("phase", "updatedAt");

CREATE TABLE "MatchEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL CHECK ("sequence" > 0),
  "step" INTEGER NOT NULL CHECK ("step" >= 0),
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MatchEvent_matchId_sequence_key" ON "MatchEvent"("matchId", "sequence");

CREATE TABLE "MatchLiveOutbox" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "settled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  CONSTRAINT "MatchLiveOutbox_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MatchLiveOutbox_matchId_revision_settled_key" ON "MatchLiveOutbox"("matchId", "revision", "settled");
CREATE INDEX "MatchLiveOutbox_deliveredAt_createdAt_idx" ON "MatchLiveOutbox"("deliveredAt", "createdAt");
