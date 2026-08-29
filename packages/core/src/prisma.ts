import { PrismaClient } from "@prisma/client";

const globalPrisma = globalThis as unknown as {
  footballBetsPrisma?: PrismaClient;
};

export const prisma =
  globalPrisma.footballBetsPrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "test"
        ? []
        : process.env.NODE_ENV === "development"
          ? ["warn", "error"]
          : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalPrisma.footballBetsPrisma = prisma;
}
