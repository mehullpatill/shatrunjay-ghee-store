import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getDatasourceUrlWithConnectionLimit() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return undefined;

  const url = new URL(connectionString);
  // Keep each Vercel serverless instance to one PostgreSQL connection.
  url.searchParams.set("connection_limit", "1");
  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(getDatasourceUrlWithConnectionLimit()
      ? { datasourceUrl: getDatasourceUrlWithConnectionLimit() }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Cache the client on the global object in every environment so warm instances
// and development hot reloads reuse the same PrismaClient.
globalForPrisma.prisma = prisma;
