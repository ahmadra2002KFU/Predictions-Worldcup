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

  return (
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
          <span className="flex-1 truncate font-medium text-brand-900">{row.displayName}</span>
          <span className="text-lg font-bold tabular-nums text-brand-700">{row.total}</span>
          <span className="text-xs text-brand-900/40">نقطة</span>
        </motion.div>
      ))}
    </div>
  );
}
