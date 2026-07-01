import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { predictions: true } },
      sessions: { orderBy: { createdAt: "asc" }, take: 1, select: { ip: true } },
    },
  });

  // Cluster by normalized (trimmed, lowercased) display name to surface duplicates.
  const nameCounts = new Map<string, number>();
  for (const p of participants) {
    const key = p.displayName.trim().toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }

  const rows = participants.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    email: p.email,
    createdAt: p.createdAt.toISOString(),
    predictionCount: p._count.predictions,
    firstIp: p.sessions[0]?.ip ?? null,
    duplicateName: (nameCounts.get(p.displayName.trim().toLowerCase()) ?? 0) > 1,
  }));

  return NextResponse.json({ participants: rows });
}
