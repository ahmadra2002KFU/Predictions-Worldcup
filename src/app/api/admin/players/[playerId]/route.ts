import { NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";

export const dynamic = "force-dynamic";

const updatePlayerSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ playerId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { playerId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updatePlayerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const player = await prisma.player.update({ where: { id: playerId }, data: parsed.data });

  await writeAuditLog({
    action: "ADMIN_PLAYER_UPDATE",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: { playerId, changes: parsed.data },
  });

  return NextResponse.json({ player });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ playerId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { playerId } = await params;

  // Players are no longer referenced by predictions or match results (best player / first
  // scorer are free text now), so a roster entry can always be removed safely.
  await prisma.player.delete({ where: { id: playerId } });
  return NextResponse.json({ ok: true });
}
