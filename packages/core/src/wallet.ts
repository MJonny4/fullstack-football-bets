import { type LedgerType, Prisma } from "@prisma/client";
import { InsufficientFundsError, UserNotFoundError } from "./errors.js";

export interface BalanceChange {
  userId: string;
  ledgerEntryId: string;
  ledgerType: LedgerType;
  amount: number;
  balanceAfter: number;
  reference: string;
}

export interface WalletTransactionResult extends BalanceChange {
  applied: boolean;
}

function assertWalletAmount(type: LedgerType, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount === 0) {
    throw new RangeError("Wallet amount must be a non-zero whole number");
  }
  if (type === "STAKE" && amount >= 0) {
    throw new RangeError("A STAKE ledger amount must be negative");
  }
  if (type !== "STAKE" && amount <= 0) {
    throw new RangeError(`${type} ledger amount must be positive`);
  }
}

/**
 * The only supported coin-balance mutation path. Callers supply an existing
 * Prisma transaction so their domain write and its ledger record commit or
 * roll back together. A per-user reference makes sequential retries no-ops.
 */
export async function applyWalletTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  type: LedgerType,
  amount: number,
  reference: string,
): Promise<WalletTransactionResult> {
  assertWalletAmount(type, amount);
  if (reference.trim().length === 0) {
    throw new RangeError("Wallet reference cannot be empty");
  }

  const existing = await tx.ledgerEntry.findUnique({
    where: { userId_reference: { userId, reference } },
  });
  if (existing) {
    if (existing.type !== type || existing.amount !== amount) {
      throw new Error(
        `Wallet reference ${reference} was already used with different details`,
      );
    }
    return {
      applied: false,
      userId,
      ledgerEntryId: existing.id,
      ledgerType: existing.type,
      amount: existing.amount,
      balanceAfter: existing.balanceAfter,
      reference: existing.reference,
    };
  }

  const updated = await tx.user.updateMany({
    where:
      amount < 0
        ? { id: userId, coinBalance: { gte: Math.abs(amount) } }
        : { id: userId },
    data: { coinBalance: { increment: amount } },
  });

  if (updated.count === 0) {
    const userExists = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) throw new UserNotFoundError(userId);
    throw new InsufficientFundsError(userId);
  }

  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { coinBalance: true },
  });
  const entry = await tx.ledgerEntry.create({
    data: {
      userId,
      type,
      amount,
      balanceAfter: user.coinBalance,
      reference,
    },
  });

  return {
    applied: true,
    userId,
    ledgerEntryId: entry.id,
    ledgerType: entry.type,
    amount: entry.amount,
    balanceAfter: entry.balanceAfter,
    reference: entry.reference,
  };
}
