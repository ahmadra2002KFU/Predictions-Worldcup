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

const createMatchSchema = z.object({
  stage: z.enum(MATCH_STAGES),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  kickoffAt: z.iso.datetime(),
  venue: z.string().trim().min(1).max(120),
});

export async function GET() {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  return NextResponse.json({ matches });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const body = await request.json().catch(() => null);
  const parsed = createMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  if (parsed.data.homeTeamId === parsed.data.awayTeamId) {
    return NextResponse.json({ error: "same_team" }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      stage: parsed.data.stage,
      homeTeamId: parsed.data.homeTeamId,
      awayTeamId: parsed.data.awayTeamId,
      kickoffAt: new Date(parsed.data.kickoffAt),
      venue: parsed.data.venue,
    },
    include: { homeTeam: true, awayTeam: true },
  });

  await writeAuditLog({
    action: "ADMIN_MATCH_CREATE",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: { matchId: match.id },
  });

  return NextResponse.json({ match });
}
