-- PostgreSQL requires new enum values to commit before a later migration may
-- reference them from a check constraint.
ALTER TYPE "BetStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "LedgerType" ADD VALUE IF NOT EXISTS 'REFUND';
