"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PredictionRow {
  id: string;
  displayName: string;
  predHomeScore: number;
  predAwayScore: number;
  predBestPlayerName: string | null;
  predFirstScorerName: string | null;
  pointsScoreOutcome: number;
  pointsBestPlayer: number;
  pointsFirstScorer: number;
  pointsTotal: number;
}

interface Props {
  matchId: string;
  actualBestPlayerName: string | null;
  actualFirstScorerName: string | null;
  predictions: PredictionRow[];
}

function ScoringRow({
  matchId,
  row,
  onSaved,
}: {
  matchId: string;
  row: PredictionRow;
  onSaved: () => void;
}) {
  const [bestPlayer, setBestPlayer] = useState(row.pointsBestPlayer > 0);
  const [firstScorer, setFirstScorer] = useState(row.pointsFirstScorer > 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const dirty = bestPlayer !== row.pointsBestPlayer > 0 || firstScorer !== row.pointsFirstScorer > 0;

  async function save() {
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/predictions/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bestPlayer, firstScorer }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const projectedTotal = row.pointsScoreOutcome + (bestPlayer ? 1 : 0) + (firstScorer ? 1 : 0);

  return (
    <tr className="border-t border-brand-100 align-top">
      <td className="px-3 py-2 font-medium text-brand-900">{row.displayName}</td>
      <td className="px-3 py-2 text-center font-bold tabular-nums text-brand-700">
        {row.predHomeScore} - {row.predAwayScore}
      </td>
      <td className="px-3 py-2 text-brand-900/80">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={bestPlayer} onChange={(e) => setBestPlayer(e.target.checked)} />
          <span>{row.predBestPlayerName ?? "—"}</span>
        </label>
      </td>
      <td className="px-3 py-2 text-brand-900/80">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={firstScorer} onChange={(e) => setFirstScorer(e.target.checked)} />
          <span>{row.predFirstScorerName ?? "—"}</span>
        </label>
      </td>
      <td className="px-3 py-2 text-center text-xs text-brand-900/60 tabular-nums">
        {row.pointsScoreOutcome} + {bestPlayer ? 1 : 0} + {firstScorer ? 1 : 0} ={" "}
        <span className="font-bold text-brand-700">{projectedTotal}</span>
      </td>
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        >
          {saving ? "..." : dirty ? "حفظ" : "محفوظ"}
        </button>
        {error && <p className="mt-1 text-[10px] text-red-600">تعذر الحفظ</p>}
      </td>
    </tr>
  );
}

export function PredictionsScoring({
  matchId,
  actualBestPlayerName,
  actualFirstScorerName,
  predictions,
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-3 rounded-lg border border-brand-100 p-4">
      <div>
        <h2 className="text-sm font-semibold text-brand-900">منح نقاط أفضل لاعب / أول هدف (يدوياً)</h2>
        <p className="mt-1 text-xs text-brand-900/60">
          فعّل الخانة لمنح نقطة (+١) لتوقع صحيح، ثم اضغط حفظ. النتيجة الفعلية للمرجع:{" "}
          <span className="font-medium text-brand-700">أفضل لاعب: {actualBestPlayerName ?? "—"}</span>
          {" · "}
          <span className="font-medium text-brand-700">أول هدف: {actualFirstScorerName ?? "—"}</span>
        </p>
      </div>

      {predictions.length === 0 ? (
        <p className="rounded-lg border border-brand-100 px-4 py-6 text-center text-sm text-brand-900/50">
          لا توجد توقعات لهذه المباراة بعد
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="bg-brand-50 text-xs text-brand-900/70">
                <th className="px-3 py-2 text-start font-medium">المشارك</th>
                <th className="px-3 py-2 text-center font-medium">التوقع</th>
                <th className="px-3 py-2 text-start font-medium">أفضل لاعب (+١)</th>
                <th className="px-3 py-2 text-start font-medium">أول هدف (+١)</th>
                <th className="px-3 py-2 text-center font-medium">المجموع</th>
                <th className="px-3 py-2 text-center font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((row) => (
                <ScoringRow key={row.id} matchId={matchId} row={row} onSaved={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
