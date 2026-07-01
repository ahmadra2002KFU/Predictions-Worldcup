"use client";

import { useRouter } from "next/navigation";

const ACTIONS = [
  "",
  "REGISTER",
  "RECOVER_ATTEMPT",
  "RECOVER_SUCCESS",
  "PREDICTION_CREATE",
  "PREDICTION_UPDATE",
  "ADMIN_LOGIN_SUCCESS",
  "ADMIN_LOGIN_FAIL",
  "ADMIN_RESULT_ENTERED",
  "ADMIN_MATCH_CREATE",
  "ADMIN_MATCH_UPDATE",
  "ADMIN_TEAM_CREATE",
  "ADMIN_PLAYER_BULK_IMPORT",
  "ADMIN_PARTICIPANT_RENAME",
];

export function AuditActionFilter({ current }: { current: string }) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `/admin/audit-log?action=${value}` : "/admin/audit-log");
      }}
      className="rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
    >
      {ACTIONS.map((a) => (
        <option key={a || "all"} value={a}>
          {a || "كل الأنشطة"}
        </option>
      ))}
    </select>
  );
}
