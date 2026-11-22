import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { hashIp } from "./security";

export async function recordAuditLog(params: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeSummary?: unknown;
  afterSummary?: unknown;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        actorEmail: params.actorEmail ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        beforeSummary: (params.beforeSummary ?? undefined) as Prisma.InputJsonValue | undefined,
        afterSummary: (params.afterSummary ?? undefined) as Prisma.InputJsonValue | undefined,
        ipHash: hashIp(params.ip),
      },
    });
  } catch (err) {
    console.error("[audit] Failed to record audit log", err);
  }
}
