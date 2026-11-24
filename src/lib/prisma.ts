import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import { getEnv } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPoolConfig(): PoolConfig {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return {};

  const baseConfig: PoolConfig = {
    // Keep the per-instance pool bounded because Vercel can run multiple
    // warm instances while the database has a small connection budget.
    max: 2,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  };

  try {
    const parsed = new URL(rawUrl);
    const sslmode = parsed.searchParams.get("sslmode");
    if (sslmode === "require" || sslmode === "no-verify" || sslmode === "prefer") {
      parsed.searchParams.delete("sslmode");
      return {
        ...baseConfig,
        connectionString: parsed.toString(),
        ssl: { rejectUnauthorized: false },
      };
    }
  } catch {
    // Fall back to direct connection string
  }

  return {
    ...baseConfig,
    connectionString: rawUrl,
  };
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  getEnv();

  const pool = new Pool(getPoolConfig());

  const client = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Reuse one Prisma client in every environment, including warm Vercel instances.
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
