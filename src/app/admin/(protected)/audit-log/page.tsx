import { prisma } from "@/lib/db";
import { AuditActionFilter } from "@/components/admin/AuditActionFilter";
import { AuditAction } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const timeFormatter = new Intl.DateTimeFormat("ar", {
  timeZone: "Asia/Riyadh",
  numberingSystem: "latn",
  dateStyle: "short",
  timeStyle: "short",
});

const ACTION_LABELS: Record<string, string> = {
  REGISTER: "تسجيل",
  RECOVER_ATTEMPT: "محاولة استرجاع",
  RECOVER_SUCCESS: "استرجاع ناجح",
  PREDICTION_CREATE: "توقع جديد",
  PREDICTION_UPDATE: "تعديل توقع",
  ADMIN_LOGIN_SUCCESS: "دخول مسؤول",
  ADMIN_LOGIN_FAIL: "فشل دخول مسؤول",
  ADMIN_TEAM_CREATE: "إضافة فريق",
  ADMIN_TEAM_UPDATE: "تعديل فريق",
  ADMIN_PLAYER_BULK_IMPORT: "استيراد لاعبين",
  ADMIN_PLAYER_UPDATE: "تعديل لاعب",
  ADMIN_MATCH_CREATE: "إنشاء مباراة",
  ADMIN_MATCH_UPDATE: "تعديل مباراة",
  ADMIN_RESULT_ENTERED: "إدخال نتيجة",
  ADMIN_PARTICIPANT_RENAME: "إعادة تسمية مشارك",
};

interface FlaggedIpRow {
  ip: string;
  participant_count: bigint;
  names: string[];
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;
  const actionFilter =
    action && action in AuditAction ? (action as keyof typeof AuditAction) : undefined;

  const [logs, flaggedIps] = await Promise.all([
    prisma.auditLog.findMany({
      where: actionFilter ? { action: actionFilter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { participant: { select: { displayName: true } } },
    }),
    prisma.$queryRaw<FlaggedIpRow[]>`
      SELECT al.ip,
             COUNT(DISTINCT al."participantId") AS participant_count,
             ARRAY_AGG(DISTINCT p."displayName") AS names
      FROM "AuditLog" al
      JOIN "Participant" p ON p.id = al."participantId"
      WHERE al.ip IS NOT NULL
      GROUP BY al.ip
      HAVING COUNT(DISTINCT al."participantId") > 1
      ORDER BY participant_count DESC
    `,
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-2xl font-bold text-brand-700">سجل النشاط</h1>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-brand-900">
            عناوين IP مشبوهة (أكثر من مستخدم من نفس العنوان)
          </h2>
          {flaggedIps.length === 0 ? (
            <p className="rounded-lg border border-brand-100 px-4 py-3 text-sm text-brand-900/50">
              لا توجد عناوين مشبوهة
            </p>
          ) : (
            <ul className="divide-y divide-brand-100 rounded-lg border border-amber-200 bg-amber-50/50">
              {flaggedIps.map((row) => (
                <li key={row.ip} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="font-mono text-xs text-brand-900/70">{row.ip}</span>
                  <span className="text-brand-900/70">
                    {Number(row.participant_count)} مستخدمين: {row.names.join("، ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-900">آخر ١٠٠ نشاط</h2>
          <AuditActionFilter current={action ?? ""} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-brand-100">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="bg-brand-50 text-xs text-brand-900/70">
                <th className="px-3 py-2 text-start font-medium">النشاط</th>
                <th className="px-3 py-2 text-start font-medium">المستخدم</th>
                <th className="px-3 py-2 text-start font-medium">IP</th>
                <th className="px-3 py-2 text-start font-medium">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-3 py-2 text-brand-900">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-3 py-2 text-brand-900/70">{log.participant?.displayName ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-brand-900/50">{log.ip ?? "—"}</td>
                  <td className="px-3 py-2 text-brand-900/60">{timeFormatter.format(log.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-brand-900/50">
                    لا يوجد نشاط
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
