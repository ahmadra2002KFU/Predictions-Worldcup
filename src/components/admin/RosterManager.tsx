"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlayerRow {
  id: string;
  name: string;
  isActive: boolean;
}

export function RosterManager({ teamId, players }: { teamId: string; players: PlayerRow[] }) {
  const router = useRouter();
  const [bulkText, setBulkText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: bulkText }),
      });
      if (!res.ok) {
        setMessage("تعذر إضافة اللاعبين");
        return;
      }
      const data = await res.json();
      setMessage(`تمت إضافة ${data.created} لاعب`);
      setBulkText("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(playerId: string, isActive: boolean) {
    await fetch(`/api/admin/players/${playerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleBulkImport} className="space-y-2">
        <label className="block text-sm font-medium text-brand-900">
          إضافة لاعبين (اسم واحد في كل سطر)
        </label>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          placeholder={"اسم اللاعب الأول\nاسم اللاعب الثاني\n..."}
        />
        <button
          type="submit"
          disabled={submitting || !bulkText.trim()}
          className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "جارٍ الإضافة..." : "إضافة"}
        </button>
        {message && <p className="text-sm text-brand-900/70">{message}</p>}
      </form>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-brand-900">قائمة اللاعبين ({players.length})</h2>
        <ul className="divide-y divide-brand-100 rounded-lg border border-brand-100">
          {players.map((player) => (
            <li key={player.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className={player.isActive ? "text-brand-900" : "text-brand-900/40 line-through"}>
                {player.name}
              </span>
              <button
                onClick={() => toggleActive(player.id, player.isActive)}
                className="text-xs text-brand-600 underline"
              >
                {player.isActive ? "تعطيل" : "تفعيل"}
              </button>
            </li>
          ))}
          {players.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-brand-900/50">لا يوجد لاعبون بعد</li>
          )}
        </ul>
      </div>
    </div>
  );
}
