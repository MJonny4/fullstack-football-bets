import type { Prisma, PrismaClient, User } from "@prisma/client";
import { applyWalletTransaction } from "./wallet.js";

export const DEFAULT_INITIAL_BALANCE = 1_000;

export interface CreateUserInput {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  initialBalance?: number;
}

type TransactionHost = Pick<PrismaClient, "$transaction">;

export async function createUserWithInitialBalance(
  db: TransactionHost,
  input: CreateUserInput,
): Promise<User> {
  const initialBalance = input.initialBalance ?? DEFAULT_INITIAL_BALANCE;
  if (!Number.isSafeInteger(initialBalance) || initialBalance <= 0) {
    throw new RangeError("initialBalance must be a positive whole number");
  }
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (
    email.length === 0 ||
    username.length === 0 ||
    displayName.length === 0 ||
    input.passwordHash.length === 0
  ) {
    throw new RangeError("email, username, displayName, and passwordHash are required");
  }

  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.user.create({
      data: { email, username, displayName, passwordHash: input.passwordHash },
    });
    await applyWalletTransaction(
      tx,
      created.id,
      "TOPUP",
      initialBalance,
      `signup:${created.id}`,
    );
    return tx.user.findUniqueOrThrow({ where: { id: created.id } });
  });
}
