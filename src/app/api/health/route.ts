import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    try {
      await prisma.$queryRawUnsafe(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE pid <> pg_backend_pid()
          AND datname = current_database()
          AND state = 'idle'
          AND query_start < NOW() - INTERVAL '20 seconds';
      `);
    } catch {
      // Ignore cleanup error
    }
    return NextResponse.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json({ status: "error", db: "disconnected" }, { status: 503 });
  }
}
