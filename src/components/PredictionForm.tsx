"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMatchLock } from "@/components/ui/Countdown";
import type { LockableStatus } from "@/lib/matchLock";

interface Props {
  matchId: string;
  kickoffAt: Date;
  status: LockableStatus;
  homeTeamName: string;
  awayTeamName: string;
  initial: {
    predHomeScore: number | null;
    predAwayScore: number | null;
    predBestPlayerName: string | null;
    predFirstScorerName: string | null;
  };
}

export function PredictionForm({
  matchId,
  kickoffAt,
  status,
  homeTeamName,
  awayTeamName,
  initial,
}: Props) {
  const router = useRouter();
  const { locked } = useMatchLock(kickoffAt, status);

  const [homeScore, setHomeScore] = useState(initial.predHomeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(initial.predAwayScore?.toString() ?? "");
  const [bestPlayerName, setBestPlayerName] = useState(initial.predBestPlayerName ?? "");
  const [firstScorerName, setFirstScorerName] = useState(initial.predFirstScorerName ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          predHomeScore: Number(homeScore),
          predAwayScore: Number(awayScore),
          predBestPlayerName: bestPlayerName.trim() || null,
          predFirstScorerName: firstScorerName.trim() || null,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) setError("تم إغلاق التوقع لهذه المباراة");
        else if (res.status === 401) setError("يجب تسجيل الدخول أولاً");
        else setError("تعذر حفظ التوقع");
        router.refresh();
        return;
      }

      setMessage("تم حفظ توقعك");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-center text-brand-900/70">
        تم إغلاق التوقع لهذه المباراة قبل ٩٠ ثانية من بدايتها.
        {initial.predHomeScore != null && (
          <p className="mt-2 font-medium text-brand-900">
            توقعك: {homeTeamName} {initial.predHomeScore} - {initial.predAwayScore} {awayTeamName}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brand-200 p-4">
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <label className="text-sm text-brand-900/70">{homeTeamName}</label>
          <input
            type="number"
            min={0}
            max={99}
            required
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-16 rounded-lg border border-brand-200 px-3 py-2 text-center text-lg font-bold outline-none focus:border-brand-500"
          />
        </div>
        <span className="mt-6 text-brand-900/40">-</span>
        <div className="flex flex-col items-center gap-1">
          <label className="text-sm text-brand-900/70">{awayTeamName}</label>
          <input
            type="number"
            min={0}
            max={99}
            required
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-16 rounded-lg border border-brand-200 px-3 py-2 text-center text-lg font-bold outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-brand-900/70">أفضل لاعب في المباراة (اختياري)</label>
        <input
          type="text"
          maxLength={80}
          value={bestPlayerName}
          onChange={(e) => setBestPlayerName(e.target.value)}
          placeholder="اكتب اسم اللاعب"
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-brand-900/70">صاحب أول هدف (اختياري)</label>
        <input
          type="text"
          maxLength={80}
          value={firstScorerName}
          onChange={(e) => setFirstScorerName(e.target.value)}
          placeholder="اكتب اسم اللاعب"
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "جارٍ الحفظ..." : "حفظ التوقع"}
      </button>
    </form>
  );
}
