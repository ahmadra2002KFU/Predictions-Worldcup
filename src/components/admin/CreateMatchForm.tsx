"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STAGE_LABELS } from "@/lib/labels";

interface TeamOption {
  id: string;
  name: string;
  flagEmoji: string | null;
}

export function CreateMatchForm({ teams }: { teams: TeamOption[] }) {
  const router = useRouter();
  const [stage, setStage] = useState("ROUND_OF_32");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [kickoffLocal, setKickoffLocal] = useState("");
  const [venue, setVenue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (homeTeamId === awayTeamId) {
      setError("لا يمكن اختيار نفس الفريق مرتين");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          homeTeamId,
          awayTeamId,
          kickoffAt: new Date(`${kickoffLocal}+03:00`).toISOString(),
          venue,
        }),
      });
      if (!res.ok) {
        setError("تعذر إنشاء المباراة");
        return;
      }
      setHomeTeamId("");
      setAwayTeamId("");
      setKickoffLocal("");
      setVenue("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-brand-100 p-4">
      <div>
        <label className="mb-1 block text-xs text-brand-900/70">الدور</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        >
          {Object.entries(STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-brand-900/70">الفريق المضيف</label>
        <select
          required
          value={homeTeamId}
          onChange={(e) => setHomeTeamId(e.target.value)}
          className="rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="">اختر فريقاً</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.flagEmoji} {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-brand-900/70">الفريق الضيف</label>
        <select
          required
          value={awayTeamId}
          onChange={(e) => setAwayTeamId(e.target.value)}
          className="rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="">اختر فريقاً</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.flagEmoji} {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-brand-900/70">موعد المباراة (بتوقيت الرياض GMT+3)</label>
        <input
          required
          type="datetime-local"
          value={kickoffLocal}
          onChange={(e) => setKickoffLocal(e.target.value)}
          className="rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-brand-900/70">الملعب</label>
        <input
          required
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        إنشاء مباراة
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
