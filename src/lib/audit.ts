import { prisma } from "./db";
import type { $Enums, Prisma } from "@/generated/prisma/client";

export function writeAuditLog(entry: {
  action: $Enums.AuditAction;
  participantId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      action: entry.action,
      participantId: entry.participantId ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      metadata: (entry.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}
