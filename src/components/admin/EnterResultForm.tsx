"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  matchId: string;
  stage: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  initial: {
    homeScore: number | null;
    awayScore: number | null;
    wentToPenalties: boolean;
    penaltyWinnerTeamId: string | null;
    bestPlayerName: string | null;
    firstScorerName: string | null;
  };
}

export function EnterResultForm({
  matchId,
  stage,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  initial,
}: Props) {
  const router = useRouter();
  const isKnockout = stage !== "GROUP";

  const [homeScore, setHomeScore] = useState(initial.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(initial.awayScore?.toString() ?? "");
  const [wentToPenalties, setWentToPenalties] = useState(initial.wentToPenalties);
  const [penaltyWinnerTeamId, setPenaltyWinnerTeamId] = useState(initial.penaltyWinnerTeamId ?? "");
  const [bestPlayerName, setBestPlayerName] = useState(initial.bestPlayerName ?? "");
  const [firstScorerName, setFirstScorerName] = useState(initial.firstScorerName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (wentToPenalties && homeScore !== awayScore) {
      setError("يجب أن تكون النتيجة متعادلة عند اللجوء لركلات الترجيح");
      return;
    }
    if (wentToPenalties && !penaltyWinnerTeamId) {
      setError("اختر الفريق الفائز بركلات الترجيح");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/result`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          wentToPenalties,
          penaltyWinnerTeamId: wentToPenalties ? penaltyWinnerTeamId : null,
          bestPlayerName: bestPlayerName.trim() || null,
          firstScorerName: firstScorerName.trim() || null,
        }),
      });

      if (!res.ok) {
        setError("تعذر حفظ النتيجة");
        return;
      }

      const data = await res.json();
      setMessage(`تم الحفظ وإعادة احتساب ${data.recalculated} توقع`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-brand-100 p-4">
      <h2 className="text-sm font-semibold text-brand-900">إدخال نتيجة المباراة</h2>

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
      <p className="text-center text-xs text-brand-900/50">
        النتيجة عند نهاية الوقت الأصلي، أو الوقت الإضافي إن وُجد (باستثناء ركلات الترجيح)
      </p>

      {isKnockout && (
        <div className="rounded-lg bg-brand-50 p-3">
          <label className="flex items-center gap-2 text-sm text-brand-900">
            <input
              type="checkbox"
              checked={wentToPenalties}
              onChange={(e) => setWentToPenalties(e.target.checked)}
            />
            انتهت بركلات الترجيح
          </label>
          {wentToPenalties && (
            <div className="mt-2">
              <label className="mb-1 block text-xs text-brand-900/70">الفريق الفائز بركلات الترجيح</label>
              <select
                value={penaltyWinnerTeamId}
                onChange={(e) => setPenaltyWinnerTeamId(e.target.value)}
                className="w-full rounded-md border border-brand-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">اختر فريقاً</option>
                <option value={homeTeamId}>{homeTeamName}</option>
                <option value={awayTeamId}>{awayTeamName}</option>
              </select>
            </div>
          )}
        </div>
      )}

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
      <p className="text-center text-xs text-brand-900/50">
        هذه القيم للعرض والمرجع فقط. نقاط أفضل لاعب/أول هدف تُمنح يدوياً لكل توقع من قائمة التوقعات أدناه.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "جارٍ الحفظ..." : "حفظ النتيجة وإعادة الاحتساب"}
      </button>
    </form>
  );
}
