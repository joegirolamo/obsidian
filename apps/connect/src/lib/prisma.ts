import { PrismaClient } from "@prisma/client";

// Extend PrismaClient to include all models
export interface ExtendedPrismaClient extends PrismaClient {
  aIConfiguration: any;
}

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  }) as ExtendedPrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 