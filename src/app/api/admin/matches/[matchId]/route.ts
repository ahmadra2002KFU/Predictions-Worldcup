import { NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";

export const dynamic = "force-dynamic";

const MATCH_STAGES = [
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTERFINAL",
  "SEMIFINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;

const updateMatchSchema = z.object({
  stage: z.enum(MATCH_STAGES).optional(),
  homeTeamId: z.string().min(1).optional(),
  awayTeamId: z.string().min(1).optional(),
  kickoffAt: z.iso.datetime().optional(),
  venue: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["SCHEDULED", "FINISHED", "POSTPONED", "CANCELLED"]).optional(),
  excludeFromScoring: z.boolean().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { matchId } = await params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: { where: { isActive: true }, orderBy: { name: "asc" } } } },
      awayTeam: { include: { players: { where: { isActive: true }, orderBy: { name: "asc" } } } },
      penaltyWinnerTeam: true,
    },
  });

  if (!match) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ match });
}

export async function PUT(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { matchId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  const { kickoffAt, ...rest } = parsed.data;
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { ...rest, ...(kickoffAt ? { kickoffAt: new Date(kickoffAt) } : {}) },
    include: { homeTeam: true, awayTeam: true },
  });

  await writeAuditLog({
    action: "ADMIN_MATCH_UPDATE",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: { matchId, changes: parsed.data },
  });

  return NextResponse.json({ match });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { matchId } = await params;
  await prisma.match.delete({ where: { id: matchId } });
  return NextResponse.json({ ok: true });
}
