import { NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";

export const dynamic = "force-dynamic";

const bulkImportSchema = z.object({
  names: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { teamId } = await params;
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = bulkImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const names = Array.from(
    new Set(
      parsed.data.names
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean)
    )
  );

  if (names.length === 0) {
    return NextResponse.json({ error: "no_names" }, { status: 400 });
  }

  const result = await prisma.player.createMany({
    data: names.map((name) => ({ teamId, name })),
    skipDuplicates: true,
  });

  await writeAuditLog({
    action: "ADMIN_PLAYER_BULK_IMPORT",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: { teamId, requested: names.length, created: result.count },
  });

  const players = await prisma.player.findMany({ where: { teamId }, orderBy: { name: "asc" } });
  return NextResponse.json({ players, created: result.count });
}
