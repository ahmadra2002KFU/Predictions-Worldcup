"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ParticipantRow {
  id: string;
  displayName: string;
  email: string | null;
  createdAt: string;
  predictionCount: number;
  firstIp: string | null;
  duplicateName: boolean;
}

export function ParticipantsTable({ participants }: { participants: ParticipantRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  async function saveRename(id: string) {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    await fetch(`/api/admin/participants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: trimmed }),
    });
    setEditingId(null);
    router.refresh();
  }

  if (participants.length === 0) {
    return <p className="text-center text-sm text-brand-900/50">لا يوجد مشاركون بعد</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-brand-100">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="bg-brand-50 text-xs text-brand-900/70">
            <th className="px-3 py-2 text-start font-medium">الاسم</th>
            <th className="px-3 py-2 text-start font-medium">البريد</th>
            <th className="px-3 py-2 text-start font-medium">التوقعات</th>
            <th className="px-3 py-2 text-start font-medium">أول IP</th>
            <th className="px-3 py-2 text-start font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-100">
          {participants.map((p) => (
            <tr key={p.id} className={p.duplicateName ? "bg-amber-50/50" : ""}>
              <td className="px-3 py-2">
                {editingId === p.id ? (
                  <span className="flex items-center gap-2">
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="rounded border border-brand-200 px-2 py-1 text-sm outline-none focus:border-brand-500"
                    />
                    <button onClick={() => saveRename(p.id)} className="text-xs text-brand-600 underline">
                      حفظ
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-brand-900/50">
                      إلغاء
                    </button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-brand-900">{p.displayName}</span>
                    {p.duplicateName && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                        اسم مكرر
                      </span>
                    )}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-brand-900/60">{p.email ?? "—"}</td>
              <td className="px-3 py-2 text-brand-900/60">{p.predictionCount}</td>
              <td className="px-3 py-2 font-mono text-xs text-brand-900/50">{p.firstIp ?? "—"}</td>
              <td className="px-3 py-2 text-end">
                {editingId !== p.id && (
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setDraftName(p.displayName);
                    }}
                    className="text-xs text-brand-600 underline"
                  >
                    إعادة تسمية
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
