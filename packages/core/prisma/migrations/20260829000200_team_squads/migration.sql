CREATE TYPE "PlayerPosition" AS ENUM (
    'GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST'
);
CREATE TYPE "LineupSource" AS ENUM ('SYSTEM', 'MANAGER');
CREATE TYPE "LineupState" AS ENUM ('DRAFT', 'ACTIVE', 'ALTERNATIVE', 'ARCHIVED');
CREATE TYPE "LineupUnit" AS ENUM ('GK', 'DEF', 'MID', 'ATT');
CREATE TYPE "MatchSide" AS ENUM ('HOME', 'AWAY');

-- Preserve existing club rows and match relations while adding public identity.
ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_strengthRating_check";
ALTER TABLE "Team"
    ALTER COLUMN "strengthRating" TYPE DECIMAL(5,2)
        USING "strengthRating"::DECIMAL(5,2),
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "abbreviation" TEXT,
    ADD COLUMN "shortName" TEXT,
    ADD COLUMN "city" TEXT,
    ADD COLUMN "stadiumName" TEXT,
    ADD COLUMN "foundedYear" INTEGER,
    ADD COLUMN "primaryColor" TEXT,
    ADD COLUMN "secondaryColor" TEXT,
    ADD COLUMN "shirtTextColor" TEXT,
    ADD COLUMN "attackRating" DECIMAL(5,2),
    ADD COLUMN "midfieldRating" DECIMAL(5,2),
    ADD COLUMN "defenseRating" DECIMAL(5,2),
    ADD COLUMN "goalkeeperRating" DECIMAL(5,2);

WITH numbered AS (
    SELECT "id", row_number() OVER (ORDER BY "id") AS sequence
    FROM "Team"
)
UPDATE "Team" AS team
SET
    "slug" = 'club-' || lower(team."id"),
    "abbreviation" = 'T' || lpad(numbered.sequence::TEXT, 2, '0'),
    "shortName" = team."name",
    "city" = 'Unknown',
    "stadiumName" = team."name" || ' Stadium',
    "foundedYear" = 1900,
    "primaryColor" = '#1F2937',
    "secondaryColor" = '#E5E7EB',
    "shirtTextColor" = '#FFFFFF',
    "attackRating" = team."strengthRating",
    "midfieldRating" = team."strengthRating",
    "defenseRating" = team."strengthRating",
    "goalkeeperRating" = team."strengthRating"
FROM numbered
WHERE team."id" = numbered."id";

ALTER TABLE "Team"
    ALTER COLUMN "slug" SET NOT NULL,
    ALTER COLUMN "abbreviation" SET NOT NULL,
    ALTER COLUMN "shortName" SET NOT NULL,
    ALTER COLUMN "city" SET NOT NULL,
    ALTER COLUMN "stadiumName" SET NOT NULL,
    ALTER COLUMN "foundedYear" SET NOT NULL,
    ALTER COLUMN "primaryColor" SET NOT NULL,
    ALTER COLUMN "secondaryColor" SET NOT NULL,
    ALTER COLUMN "shirtTextColor" SET NOT NULL,
    ALTER COLUMN "attackRating" SET NOT NULL,
    ALTER COLUMN "midfieldRating" SET NOT NULL,
    ALTER COLUMN "defenseRating" SET NOT NULL,
    ALTER COLUMN "goalkeeperRating" SET NOT NULL;

CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
CREATE UNIQUE INDEX "Team_abbreviation_key" ON "Team"("abbreviation");

ALTER TABLE "Team"
    ADD CONSTRAINT "Team_strengthRating_check"
        CHECK ("strengthRating" BETWEEN 1 AND 100),
    ADD CONSTRAINT "Team_unitRatings_check"
        CHECK (
            "attackRating" BETWEEN 1 AND 100 AND
            "midfieldRating" BETWEEN 1 AND 100 AND
            "defenseRating" BETWEEN 1 AND 100 AND
            "goalkeeperRating" BETWEEN 1 AND 100
        ),
    ADD CONSTRAINT "Team_slug_check"
        CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "Team_abbreviation_check"
        CHECK ("abbreviation" ~ '^[A-Z0-9]{3}$'),
    ADD CONSTRAINT "Team_profile_text_check"
        CHECK (
            length(btrim("shortName")) > 0 AND
            length(btrim("city")) > 0 AND
            length(btrim("stadiumName")) > 0
        ),
    ADD CONSTRAINT "Team_foundedYear_check"
        CHECK ("foundedYear" BETWEEN 1800 AND 2100),
    ADD CONSTRAINT "Team_colors_check"
        CHECK (
            "primaryColor" ~ '^#[0-9A-Fa-f]{6}$' AND
            "secondaryColor" ~ '^#[0-9A-Fa-f]{6}$' AND
            "shirtTextColor" ~ '^#[0-9A-Fa-f]{6}$'
        );

-- Existing fixtures receive the same server-authoritative one-hour deadline.
ALTER TABLE "Match" ADD COLUMN "lineupLocksAt" TIMESTAMP(3);
UPDATE "Match" SET "lineupLocksAt" = "scheduledAt" - INTERVAL '1 hour';
ALTER TABLE "Match" ALTER COLUMN "lineupLocksAt" SET NOT NULL;
CREATE INDEX "Match_status_lineupLocksAt_idx" ON "Match"("status", "lineupLocksAt");

ALTER TABLE "OddsSnapshot" ADD COLUMN "revisionKey" TEXT;
CREATE UNIQUE INDEX "OddsSnapshot_matchId_revisionKey_market_selection_key"
    ON "OddsSnapshot"("matchId", "revisionKey", "market", "selection");

ALTER TABLE "Bet" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_cancelled_state_check"
    CHECK (
        ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL AND "payout" IS NULL) OR
        ("status" <> 'CANCELLED' AND "cancelledAt" IS NULL)
    );

CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "generationKey" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationalityCode" CHAR(2) NOT NULL,
    "shirtNumber" INTEGER NOT NULL,
    "primaryPosition" "PlayerPosition" NOT NULL,
    "secondaryPositions" "PlayerPosition"[] NOT NULL DEFAULT ARRAY[]::"PlayerPosition"[],
    "overallRating" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "pace" INTEGER,
    "shooting" INTEGER,
    "passing" INTEGER,
    "dribbling" INTEGER,
    "defending" INTEGER,
    "physical" INTEGER,
    "diving" INTEGER,
    "handling" INTEGER,
    "kicking" INTEGER,
    "reflexes" INTEGER,
    "speed" INTEGER,
    "positioning" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Player_name_check"
        CHECK (length(btrim("firstName")) > 0 AND length(btrim("lastName")) > 0),
    CONSTRAINT "Player_nationalityCode_check"
        CHECK ("nationalityCode" ~ '^[A-Z]{2}$'),
    CONSTRAINT "Player_shirtNumber_check"
        CHECK ("shirtNumber" BETWEEN 1 AND 99),
    CONSTRAINT "Player_overallRating_check"
        CHECK ("overallRating" BETWEEN 1 AND 99),
    CONSTRAINT "Player_secondaryPositions_check"
        CHECK (
            cardinality("secondaryPositions") <= 2 AND
            NOT ("primaryPosition" = ANY("secondaryPositions"))
        ),
    CONSTRAINT "Player_attribute_ranges_check"
        CHECK (
            ("pace" IS NULL OR "pace" BETWEEN 1 AND 99) AND
            ("shooting" IS NULL OR "shooting" BETWEEN 1 AND 99) AND
            ("passing" IS NULL OR "passing" BETWEEN 1 AND 99) AND
            ("dribbling" IS NULL OR "dribbling" BETWEEN 1 AND 99) AND
            ("defending" IS NULL OR "defending" BETWEEN 1 AND 99) AND
            ("physical" IS NULL OR "physical" BETWEEN 1 AND 99) AND
            ("diving" IS NULL OR "diving" BETWEEN 1 AND 99) AND
            ("handling" IS NULL OR "handling" BETWEEN 1 AND 99) AND
            ("kicking" IS NULL OR "kicking" BETWEEN 1 AND 99) AND
            ("reflexes" IS NULL OR "reflexes" BETWEEN 1 AND 99) AND
            ("speed" IS NULL OR "speed" BETWEEN 1 AND 99) AND
            ("positioning" IS NULL OR "positioning" BETWEEN 1 AND 99)
        ),
    CONSTRAINT "Player_attribute_shape_check"
        CHECK (
            (
                "primaryPosition" = 'GK' AND
                cardinality("secondaryPositions") = 0 AND
                "pace" IS NULL AND "shooting" IS NULL AND
                "passing" IS NULL AND "dribbling" IS NULL AND
                "defending" IS NULL AND "physical" IS NULL AND
                "diving" IS NOT NULL AND "handling" IS NOT NULL AND
                "kicking" IS NOT NULL AND "reflexes" IS NOT NULL AND
                "speed" IS NOT NULL AND "positioning" IS NOT NULL
            ) OR (
                "primaryPosition" <> 'GK' AND
                NOT ('GK' = ANY("secondaryPositions")) AND
                "pace" IS NOT NULL AND "shooting" IS NOT NULL AND
                "passing" IS NOT NULL AND "dribbling" IS NOT NULL AND
                "defending" IS NOT NULL AND "physical" IS NOT NULL AND
                "diving" IS NULL AND "handling" IS NULL AND
                "kicking" IS NULL AND "reflexes" IS NULL AND
                "speed" IS NULL AND "positioning" IS NULL
            )
        )
);

CREATE UNIQUE INDEX "Player_generationKey_key" ON "Player"("generationKey");
CREATE UNIQUE INDEX "Player_teamId_shirtNumber_key" ON "Player"("teamId", "shirtNumber");
CREATE INDEX "Player_teamId_primaryPosition_idx" ON "Player"("teamId", "primaryPosition");
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TeamLineup" (
    "id" TEXT NOT NULL,
    "generationKey" TEXT,
    "teamId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "formation" TEXT NOT NULL,
    "source" "LineupSource" NOT NULL,
    "state" "LineupState" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "TeamLineup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamLineup_label_check" CHECK (length(btrim("label")) > 0),
    CONSTRAINT "TeamLineup_formation_check"
        CHECK ("formation" IN ('4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2')),
    CONSTRAINT "TeamLineup_source_state_check"
        CHECK (
            ("state" <> 'DRAFT' OR "source" = 'MANAGER') AND
            ("state" <> 'ALTERNATIVE' OR "source" = 'SYSTEM')
        )
);

CREATE UNIQUE INDEX "TeamLineup_generationKey_key" ON "TeamLineup"("generationKey");
CREATE INDEX "TeamLineup_teamId_state_idx" ON "TeamLineup"("teamId", "state");
ALTER TABLE "TeamLineup" ADD CONSTRAINT "TeamLineup_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Team" ADD COLUMN "currentOfficialLineupId" TEXT;
CREATE UNIQUE INDEX "Team_currentOfficialLineupId_key" ON "Team"("currentOfficialLineupId");
ALTER TABLE "Team" ADD CONSTRAINT "Team_currentOfficialLineupId_fkey"
    FOREIGN KEY ("currentOfficialLineupId") REFERENCES "TeamLineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DTAssignment" ADD COLUMN "draftLineupId" TEXT;
CREATE UNIQUE INDEX "DTAssignment_draftLineupId_key" ON "DTAssignment"("draftLineupId");
ALTER TABLE "DTAssignment" ADD CONSTRAINT "DTAssignment_draftLineupId_fkey"
    FOREIGN KEY ("draftLineupId") REFERENCES "TeamLineup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TeamLineupSlot" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "slotPosition" "PlayerPosition" NOT NULL,
    "unit" "LineupUnit" NOT NULL,

    CONSTRAINT "TeamLineupSlot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamLineupSlot_slotKey_check" CHECK (length(btrim("slotKey")) > 0),
    CONSTRAINT "TeamLineupSlot_sortOrder_check" CHECK ("sortOrder" BETWEEN 0 AND 10)
);

CREATE UNIQUE INDEX "TeamLineupSlot_lineupId_slotKey_key" ON "TeamLineupSlot"("lineupId", "slotKey");
CREATE UNIQUE INDEX "TeamLineupSlot_lineupId_playerId_key" ON "TeamLineupSlot"("lineupId", "playerId");
CREATE INDEX "TeamLineupSlot_playerId_idx" ON "TeamLineupSlot"("playerId");
ALTER TABLE "TeamLineupSlot" ADD CONSTRAINT "TeamLineupSlot_lineupId_fkey"
    FOREIGN KEY ("lineupId") REFERENCES "TeamLineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamLineupSlot" ADD CONSTRAINT "TeamLineupSlot_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MatchLineupSnapshot" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "side" "MatchSide" NOT NULL,
    "sourceLineupId" TEXT NOT NULL,
    "formation" TEXT NOT NULL,
    "lineupDeadline" TIMESTAMP(3) NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallRating" DECIMAL(5,2) NOT NULL,
    "attackRating" DECIMAL(5,2) NOT NULL,
    "midfieldRating" DECIMAL(5,2) NOT NULL,
    "defenseRating" DECIMAL(5,2) NOT NULL,
    "goalkeeperRating" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "MatchLineupSnapshot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MatchLineupSnapshot_formation_check"
        CHECK ("formation" IN ('4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2')),
    CONSTRAINT "MatchLineupSnapshot_ratings_check"
        CHECK (
            "overallRating" BETWEEN 1 AND 100 AND
            "attackRating" BETWEEN 1 AND 100 AND
            "midfieldRating" BETWEEN 1 AND 100 AND
            "defenseRating" BETWEEN 1 AND 100 AND
            "goalkeeperRating" BETWEEN 1 AND 100
        )
);

CREATE UNIQUE INDEX "MatchLineupSnapshot_matchId_side_key" ON "MatchLineupSnapshot"("matchId", "side");
CREATE INDEX "MatchLineupSnapshot_teamId_lockedAt_idx" ON "MatchLineupSnapshot"("teamId", "lockedAt" DESC);
ALTER TABLE "MatchLineupSnapshot" ADD CONSTRAINT "MatchLineupSnapshot_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchLineupSnapshot" ADD CONSTRAINT "MatchLineupSnapshot_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatchLineupSnapshot" ADD CONSTRAINT "MatchLineupSnapshot_sourceLineupId_fkey"
    FOREIGN KEY ("sourceLineupId") REFERENCES "TeamLineup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MatchLineupSnapshotSlot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "assignedPosition" "PlayerPosition" NOT NULL,
    "unit" "LineupUnit" NOT NULL,
    "sourceOverall" INTEGER NOT NULL,
    "positionPenalty" INTEGER NOT NULL,
    "adjustedRating" INTEGER NOT NULL,

    CONSTRAINT "MatchLineupSnapshotSlot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MatchLineupSnapshotSlot_slotKey_check" CHECK (length(btrim("slotKey")) > 0),
    CONSTRAINT "MatchLineupSnapshotSlot_sortOrder_check" CHECK ("sortOrder" BETWEEN 0 AND 10),
    CONSTRAINT "MatchLineupSnapshotSlot_rating_check"
        CHECK (
            "sourceOverall" BETWEEN 1 AND 99 AND
            "positionPenalty" BETWEEN 0 AND 5 AND
            "adjustedRating" BETWEEN 1 AND 99 AND
            "adjustedRating" = GREATEST(1, "sourceOverall" - "positionPenalty")
        )
);

CREATE UNIQUE INDEX "MatchLineupSnapshotSlot_snapshotId_slotKey_key" ON "MatchLineupSnapshotSlot"("snapshotId", "slotKey");
CREATE UNIQUE INDEX "MatchLineupSnapshotSlot_snapshotId_playerId_key" ON "MatchLineupSnapshotSlot"("snapshotId", "playerId");
CREATE INDEX "MatchLineupSnapshotSlot_playerId_idx" ON "MatchLineupSnapshotSlot"("playerId");
ALTER TABLE "MatchLineupSnapshotSlot" ADD CONSTRAINT "MatchLineupSnapshotSlot_snapshotId_fkey"
    FOREIGN KEY ("snapshotId") REFERENCES "MatchLineupSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchLineupSnapshotSlot" ADD CONSTRAINT "MatchLineupSnapshotSlot_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
