export interface PredictionRow {
  id: string;
  displayName: string;
  predHomeScore: number;
  predAwayScore: number;
  predBestPlayerName: string | null;
  predFirstScorerName: string | null;
  pointsTotal: number;
  isMine: boolean;
}

interface Props {
  predictions: PredictionRow[];
  finished: boolean;
  homeTeamName: string;
  awayTeamName: string;
}

export function MatchPredictionsList({ predictions, finished, homeTeamName, awayTeamName }: Props) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-brand-900">توقعات الجميع</h2>
      {predictions.length === 0 ? (
        <p className="rounded-xl border border-brand-100 px-4 py-6 text-center text-sm text-brand-900/50">
          لم يقدّم أحد توقعاً لهذه المباراة
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-100">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="bg-brand-50 text-xs text-brand-900/70">
                <th className="px-3 py-2 text-start font-medium">المشارك</th>
                <th className="px-3 py-2 text-center font-medium">
                  {homeTeamName} - {awayTeamName}
                </th>
                <th className="px-3 py-2 text-start font-medium">أفضل لاعب</th>
                <th className="px-3 py-2 text-start font-medium">أول هدف</th>
                {finished && <th className="px-3 py-2 text-center font-medium">النقاط</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {predictions.map((p) => (
                <tr key={p.id} className={p.isMine ? "bg-brand-50/60" : ""}>
                  <td className="px-3 py-2 font-medium text-brand-900">
                    {p.displayName}
                    {p.isMine && <span className="ms-1 text-[10px] text-brand-500">(أنت)</span>}
                  </td>
                  <td className="px-3 py-2 text-center font-bold tabular-nums text-brand-700">
                    {p.predHomeScore} - {p.predAwayScore}
                  </td>
                  <td className="px-3 py-2 text-brand-900/70">{p.predBestPlayerName ?? "—"}</td>
                  <td className="px-3 py-2 text-brand-900/70">{p.predFirstScorerName ?? "—"}</td>
                  {finished && (
                    <td className="px-3 py-2 text-center font-bold text-brand-700">{p.pointsTotal}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-brand-900/40">
        تظهر توقعات الجميع بعد إغلاق المباراة فقط (قبل ٩٠ ثانية من انطلاقها).
      </p>
    </div>
  );
}
