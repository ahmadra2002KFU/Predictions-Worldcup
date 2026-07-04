"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRealtimeChannel } from "@/hooks/useRealtimeBus";
import type { LeaderboardStanding } from "@/lib/leaderboard";

const RANK_ACCENT: Record<number, string> = {
  1: "bg-amber-100 text-amber-700",
  2: "bg-zinc-100 text-zinc-600",
  3: "bg-orange-100 text-orange-700",
};

type ParticipantProfile = {
  participant: { id: string; displayName: string };
  summary: {
    predictions: number;
    scoreOutcome: number;
    bestPlayer: number;
    firstScorer: number;
    total: number;
  };
  predictions: Array<{
    id: string;
    match: {
      id: string;
      kickoffAt: string;
      excludeFromScoring: boolean;
      homeTeam: { id: string; name: string; nameEn: string | null; flagEmoji: string | null } | null;
      awayTeam: { id: string; name: string; nameEn: string | null; flagEmoji: string | null } | null;
      homeScore: number | null;
      awayScore: number | null;
      wentToPenalties: boolean;
      penaltyWinnerTeamId: string | null;
      penaltyWinnerTeam: { id: string; name: string; nameEn: string | null; flagEmoji: string | null } | null;
      bestPlayerName: string | null;
      firstScorerName: string | null;
    };
    prediction: {
      homeScore: number;
      awayScore: number;
      bestPlayerName: string | null;
      firstScorerName: string | null;
    };
    points: {
      scoreOutcome: number;
      bestPlayer: number;
      firstScorer: number;
      total: number;
      countedTotal: number;
    };
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("ar", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function teamLabel(team: ParticipantProfile["predictions"][number]["match"]["homeTeam"]): string {
  if (!team) return "لم يتحدد";
  return `${team.flagEmoji ? `${team.flagEmoji} ` : ""}${team.name}`;
}

function formatMatchResult(match: ParticipantProfile["predictions"][number]["match"]): string {
  const score = match.homeScore !== null && match.awayScore !== null ? `${match.homeScore} - ${match.awayScore}` : "—";
  if (!match.wentToPenalties) return score;
  const winner = match.penaltyWinnerTeam ? ` · تأهل ${teamLabel(match.penaltyWinnerTeam)}` : "";
  return `${score} ركلات ترجيح${winner}`;
}

function ProfileModal({
  profile,
  loadingName,
  error,
  onClose,
}: {
  profile: ParticipantProfile | null;
  loadingName: string | null;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 h-full w-full cursor-default" aria-label="إغلاق" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-brand-100 bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-brand-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-900/45">ملف المشارك</p>
            <h2 className="truncate text-xl font-bold text-brand-900">
              {profile?.participant.displayName ?? loadingName ?? "المشارك"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
          >
            إغلاق
          </button>
        </div>

        {error ? (
          <div className="p-6 text-center text-sm font-semibold text-red-700">{error}</div>
        ) : !profile ? (
          <div className="p-8 text-center text-sm text-brand-900/55">جارٍ تحميل توقعات {loadingName}...</div>
        ) : (
          <div className="max-h-[74vh] overflow-y-auto px-5 py-4">
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl bg-brand-50 p-3 text-center">
                <div className="text-2xl font-black text-brand-700">{profile.summary.total}</div>
                <div className="text-xs text-brand-900/50">إجمالي النقاط</div>
              </div>
              <div className="rounded-2xl bg-brand-50 p-3 text-center">
                <div className="text-2xl font-black text-brand-700">{profile.summary.predictions}</div>
                <div className="text-xs text-brand-900/50">توقع منتهٍ</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                <div className="text-2xl font-black text-emerald-700">{profile.summary.scoreOutcome}</div>
                <div className="text-xs text-emerald-900/55">نقاط النتائج</div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-center">
                <div className="text-2xl font-black text-amber-700">
                  {profile.summary.bestPlayer + profile.summary.firstScorer}
                </div>
                <div className="text-xs text-amber-900/55">نقاط إضافية</div>
              </div>
            </div>

            {profile.predictions.length === 0 ? (
              <p className="rounded-2xl border border-brand-100 p-6 text-center text-sm text-brand-900/50">
                لا توجد توقعات منتهية لهذا المشارك حتى الآن.
              </p>
            ) : (
              <div className="space-y-3">
                {profile.predictions.map((row) => {
                  const home = teamLabel(row.match.homeTeam);
                  const away = teamLabel(row.match.awayTeam);
                  return (
                    <article key={row.id} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-brand-900">
                            {home} × {away}
                          </h3>
                          <p className="mt-0.5 text-xs text-brand-900/45">
                            {dateFormatter.format(new Date(row.match.kickoffAt))}
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-700 px-3 py-1 text-sm font-black text-white">
                          +{row.points.countedTotal}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-xl bg-brand-50 px-3 py-2">
                          <div className="text-xs text-brand-900/45">توقعه</div>
                          <div className="font-bold tabular-nums text-brand-800" dir="ltr">
                            {row.prediction.homeScore} - {row.prediction.awayScore}
                          </div>
                        </div>
                        <div className="rounded-xl bg-brand-50 px-3 py-2">
                          <div className="text-xs text-brand-900/45">النتيجة</div>
                          <div className="font-bold text-brand-800">{formatMatchResult(row.match)}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                          النتيجة +{row.points.scoreOutcome}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                          أفضل لاعب +{row.points.bestPlayer}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                          أول هدف +{row.points.firstScorer}
                        </span>
                        {row.match.excludeFromScoring && (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">لا تُحسب في الصدارة</span>
                        )}
                      </div>

                      {(row.prediction.bestPlayerName || row.prediction.firstScorerName) && (
                        <div className="mt-2 text-xs leading-5 text-brand-900/55">
                          {row.prediction.bestPlayerName && <span>أفضل لاعب: {row.prediction.bestPlayerName}</span>}
                          {row.prediction.bestPlayerName && row.prediction.firstScorerName && <span> · </span>}
                          {row.prediction.firstScorerName && <span>أول هدف: {row.prediction.firstScorerName}</span>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function LeaderboardTable({ standings: initial }: { standings: LeaderboardStanding[] }) {
  const [standings, setStandings] = useState(initial);
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [loadingName, setLoadingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useRealtimeChannel<{ standings: LeaderboardStanding[] }>("leaderboard", (data) => {
    setStandings(data.standings);
  });

  async function openProfile(row: LeaderboardStanding) {
    setProfile(null);
    setError(null);
    setLoadingName(row.displayName);
    try {
      const response = await fetch(`/api/participants/${encodeURIComponent(row.id)}/profile`, { cache: "no-store" });
      if (!response.ok) throw new Error("profile_fetch_failed");
      const data = (await response.json()) as ParticipantProfile;
      setProfile(data);
    } catch {
      setError("تعذر تحميل ملف المشارك. حاول مرة أخرى.");
    }
  }

  function closeProfile() {
    setProfile(null);
    setLoadingName(null);
    setError(null);
  }

  if (standings.length === 0) {
    return <p className="text-center text-brand-900/50">لا يوجد مشاركون بعد</p>;
  }

  const highest = standings[0];
  const lowestTotal = Math.min(...standings.map((row) => row.total));
  const coffeeCandidates = standings.filter((row) => row.total === lowestTotal);
  const coffeeNames = coffeeCandidates.map((row) => row.displayName).join("، ");

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-amber-900/40">
            ☕
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-amber-800 dark:text-amber-200">القهوة على مين؟</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900/75 dark:text-amber-100/75">
              حالياً القهوة على <span className="font-bold">{coffeeNames}</span> بـ {lowestTotal} نقطة.
              {highest && highest.total !== lowestTotal && (
                <span> أعلى نقاط حالياً: {highest.displayName} بـ {highest.total} نقطة.</span>
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-2">
        {standings.map((row) => (
          <motion.button
            type="button"
            key={row.id}
            layout={!reduce}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            onClick={() => void openProfile(row)}
            className="flex w-full items-center gap-3 rounded-xl border border-brand-100 bg-surface px-4 py-3 text-start shadow-sm transition hover:border-brand-200 hover:bg-brand-50/60 focus:outline-none focus:ring-2 focus:ring-brand-300"
            aria-haspopup="dialog"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                RANK_ACCENT[row.rank] ?? "bg-brand-50 text-brand-600"
              }`}
            >
              {row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-brand-900">{row.displayName}</span>
                {row.currentStreak >= 2 && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-700 ring-1 ring-orange-200"
                    title={`سلسلة صحيحة حالية: ${row.currentStreak}. أفضل سلسلة: ${row.bestStreak}`}
                    aria-label={`سلسلة صحيحة حالية ${row.currentStreak}`}
                  >
                    <span aria-hidden="true">🔥</span>
                    <span dir="ltr">{row.currentStreak}</span>
                  </span>
                )}
              </div>
              {row.bestStreak >= 3 ? (
                <p className="mt-0.5 text-xs text-brand-900/45">أفضل سلسلة: {row.bestStreak}</p>
              ) : (
                <p className="mt-0.5 text-xs text-brand-900/35">اضغط لعرض التوقعات والنقاط</p>
              )}
            </div>
            <span className="text-lg font-bold tabular-nums text-brand-700">{row.total}</span>
            <span className="text-xs text-brand-900/40">نقطة</span>
          </motion.button>
        ))}
      </div>

      {(loadingName || profile || error) && (
        <ProfileModal profile={profile} loadingName={loadingName} error={error} onClose={closeProfile} />
      )}
    </div>
  );
}
