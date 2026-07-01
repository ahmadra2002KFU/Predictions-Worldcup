import { NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";
import { normalizeFlagInput } from "@/lib/flags";

export const dynamic = "force-dynamic";

const updateTeamSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  nameEn: z.string().trim().max(80).optional(),
  flagEmoji: z.string().trim().max(8).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { teamId } = await params;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { players: { orderBy: { name: "asc" } } },
  });

  if (!team) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ team });
}

export async function PUT(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { teamId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.flagEmoji !== undefined) {
    data.flagEmoji = normalizeFlagInput(data.flagEmoji) ?? undefined;
  }
  const team = await prisma.team.update({ where: { id: teamId }, data });

  await writeAuditLog({
    action: "ADMIN_TEAM_UPDATE",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: { teamId: team.id, changes: parsed.data },
  });

  return NextResponse.json({ team });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { teamId } = await params;
  const matchCount = await prisma.match.count({
    where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
  });

  if (matchCount > 0) {
    return NextResponse.json(
      { error: "team_in_use", message: "لا يمكن حذف فريق مرتبط بمباريات" },
      { status: 409 }
    );
  }

  await prisma.team.delete({ where: { id: teamId } });
  return NextResponse.json({ ok: true });
}
