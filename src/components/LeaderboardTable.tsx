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

export function LeaderboardTable({ standings: initial }: { standings: LeaderboardStanding[] }) {
  const [standings, setStandings] = useState(initial);
  const reduce = useReducedMotion();

  useRealtimeChannel<{ standings: LeaderboardStanding[] }>("leaderboard", (data) => {
    setStandings(data.standings);
  });

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
          <motion.div
            key={row.id}
            layout={!reduce}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="flex items-center gap-3 rounded-xl border border-brand-100 bg-surface px-4 py-3 shadow-sm"
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
              {row.bestStreak >= 3 && (
                <p className="mt-0.5 text-xs text-brand-900/45">أفضل سلسلة: {row.bestStreak}</p>
              )}
            </div>
            <span className="text-lg font-bold tabular-nums text-brand-700">{row.total}</span>
            <span className="text-xs text-brand-900/40">نقطة</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
