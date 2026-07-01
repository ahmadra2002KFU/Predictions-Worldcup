import { NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";

export const dynamic = "force-dynamic";

const renameSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
});

export async function PUT(request: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { participantId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const existing = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const participant = await prisma.participant.update({
    where: { id: participantId },
    data: { displayName: parsed.data.displayName },
  });

  await writeAuditLog({
    action: "ADMIN_PARTICIPANT_RENAME",
    participantId,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: { from: existing.displayName, to: parsed.data.displayName },
  });

  return NextResponse.json({ participant: { id: participant.id, displayName: participant.displayName } });
}
