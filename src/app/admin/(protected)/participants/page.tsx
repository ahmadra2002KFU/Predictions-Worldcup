import { prisma } from "@/lib/db";
import { ParticipantsTable } from "@/components/admin/ParticipantsTable";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage() {
  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { predictions: true } },
      sessions: { orderBy: { createdAt: "asc" }, take: 1, select: { ip: true } },
    },
  });

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">المشاركون</h1>
      <p className="text-sm text-brand-900/60">
        الأسماء المكررة مميّزة باللون الأصفر. يمكنك إعادة تسمية أي مشارك لتمييزه.
      </p>
      <ParticipantsTable participants={rows} />
    </div>
  );
}
