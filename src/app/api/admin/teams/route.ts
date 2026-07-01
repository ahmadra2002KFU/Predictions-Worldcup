import { NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";
import { normalizeFlagInput } from "@/lib/flags";

export const dynamic = "force-dynamic";

const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().max(80).optional(),
  flagEmoji: z.string().trim().max(8).optional(),
});

export async function GET() {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true } } },
  });

  return NextResponse.json({ teams });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const body = await request.json().catch(() => null);
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: { ...parsed.data, flagEmoji: normalizeFlagInput(parsed.data.flagEmoji) },
  });

  await writeAuditLog({
    action: "ADMIN_TEAM_CREATE",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: { teamId: team.id, name: team.name },
  });

  return NextResponse.json({ team });
}
