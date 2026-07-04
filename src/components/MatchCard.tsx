"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { TeamFlag } from "@/components/TeamFlag";
import { useMatchLock } from "@/components/ui/Countdown";
import { EditCountdown } from "@/components/EditCountdown";
import { formatKickoff } from "@/lib/format";
import type { LockableStatus } from "@/lib/matchLock";

interface Team {
  name: string;
  flagEmoji: string | null;
}

export interface PredictionPreview {
  id: string;
  displayName: string;
  predHomeScore: number;
  predAwayScore: number;
  predBestPlayerName: string | null;
  predFirstScorerName: string | null;
  pointsTotal: number;
  isMine: boolean;
}

export interface BestPredictionPreview extends PredictionPreview {
  rankLabel: string;
}

interface MatchCardProps {
  id: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeSlotLabel: string | null;
  awaySlotLabel: string | null;
  kickoffAt: Date;
  status: LockableStatus;
  homeScore: number | null;
  awayScore: number | null;
  index?: number;
  /** Predictions the current viewer is allowed to see (own always; others after lock; admin sees all). */
  predictions?: PredictionPreview[];
  /** Top positive-point predictions for a finished match. */
  bestPredictions?: BestPredictionPreview[];
  /** Count of others' predictions still hidden (regular viewer, before lock) — shown as a hint only. */
  hiddenPredictionCount?: number;
  /** True when the viewer is the admin (used to label predictions shown before lock). */
  isAdminView?: boolean;
  /** True when the current viewer has already submitted a prediction for this match. */
  hasMyPrediction?: boolean;
}

function StatusBadge({ kickoffAt, status }: { kickoffAt: Date; status: LockableStatus }) {
  const { locked, secondsToLock } = useMatchLock(kickoffAt, status);

  if (status === "FINISHED") {
    return (
      <span className="rounded-full bg-brand-900/5 px-2.5 py-1 text-[11px] font-medium text-brand-900/50">
        انتهت
      </span>
    );
  }
  if (status === "POSTPONED") {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
        مؤجلة
      </span>
    );
  }
  if (status === "CANCELLED") {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">
        ملغاة
      </span>
    );
  }

  if (locked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        مقفلة
      </span>
    );
  }

  if (secondsToLock < 3600) {
    const minutes = Math.floor(secondsToLock / 60);
    const seconds = secondsToLock % 60;
    const urgent = secondsToLock <= 60;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums ${
          urgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${urgent ? "animate-pulse bg-red-500" : "bg-amber-500"}`} />
        يقفل خلال {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    );
  }

  return (
    <span className="rounded-full border border-brand-200 px-2.5 py-1 text-[11px] font-medium text-brand-600">
      قادمة
    </span>
  );
}

function Side({
  team,
  slotLabel,
  align,
}: {
  team: Team | null;
  slotLabel: string | null;
  align: "start" | "end";
}) {
  const dir = align === "start" ? "justify-end" : "justify-start";
  const flag = (
    <TeamFlag flagEmoji={team?.flagEmoji ?? null} size="lg" />
  );
  const text = team ? (
    <span className="truncate text-sm font-semibold text-brand-900 sm:text-base">{team.name}</span>
  ) : (
    <span className="truncate text-xs font-medium text-brand-900/50">{slotLabel ?? "غير محدد"}</span>
  );

  return (
    <div className={`flex items-center gap-2.5 ${dir}`}>
      {align === "start" ? (
        <>
          {text}
          {flag}
        </>
      ) : (
        <>
          {flag}
          {text}
        </>
      )}
    </div>
  );
}

function PredictionsPanel({
  predictions,
  bestPredictions,
  hiddenCount,
  finished,
  isAdminView,
}: {
  predictions: PredictionPreview[];
  bestPredictions: BestPredictionPreview[];
  hiddenCount: number;
  finished: boolean;
  isAdminView: boolean;
}) {
  if (predictions.length === 0 && hiddenCount === 0) return null;

  return (
    <div className="border-t border-brand-100 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-brand-900/60">
          توقعات المشاركين{predictions.length > 0 ? ` (${predictions.length + hiddenCount})` : ""}
        </span>
        {isAdminView && !finished && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-medium text-brand-600">
            عرض المشرف
          </span>
        )}
      </div>

      {finished && bestPredictions.length > 0 && (
        <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 text-emerald-950">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-emerald-800">
            <span aria-hidden="true">🏆</span>
            <span>أفضل التوقعات</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bestPredictions.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-emerald-100"
                title={`${p.displayName}: ${p.predHomeScore}-${p.predAwayScore} · ${p.pointsTotal} نقطة`}
              >
                <span>{p.rankLabel}</span>
                <span className="max-w-24 truncate">{p.displayName}</span>
                <span dir="ltr" className="tabular-nums text-emerald-700">
                  {p.predHomeScore}-{p.predAwayScore}
                </span>
                <span className="text-emerald-700">+{p.pointsTotal}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {predictions.length > 0 && (
        <div className="max-h-44 space-y-1.5 overflow-y-auto pe-1">
          {predictions.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span
                  className={`truncate text-xs font-medium ${
                    p.isMine ? "text-brand-700" : "text-brand-900/80"
                  }`}
                >
                  {p.displayName}
                  {p.isMine && <span className="ms-1 text-[9px] text-brand-500">(أنت)</span>}
                </span>
                {(p.predBestPlayerName || p.predFirstScorerName) && (
                  <div className="truncate text-[10px] text-brand-900/40">
                    {[p.predBestPlayerName, p.predFirstScorerName].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="tabular-nums text-xs font-bold text-brand-700">
                  {p.predHomeScore} - {p.predAwayScore}
                </span>
                {finished && (
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-brand-700">
                    {p.pointsTotal}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hiddenCount > 0 && (
        <p className="mt-1 text-[10px] text-brand-900/40">
          {predictions.length > 0
            ? `و${hiddenCount} توقعاً آخر يظهر بعد إغلاق المباراة`
            : `${hiddenCount} توقعاً — تظهر بعد إغلاق المباراة (قبل ٩٠ ثانية من انطلاقها)`}
        </p>
      )}
    </div>
  );
}

export function MatchCard({
  id,
  homeTeam,
  awayTeam,
  homeSlotLabel,
  awaySlotLabel,
  kickoffAt,
  status,
  homeScore,
  awayScore,
  index = 0,
  predictions = [],
  bestPredictions = [],
  hiddenPredictionCount = 0,
  isAdminView = false,
  hasMyPrediction = false,
}: MatchCardProps) {
  const reduce = useReducedMotion();
  const finished = status === "FINISHED";
  const cardClassName = finished
    ? "overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/80 shadow-sm grayscale transition-[border-color,box-shadow,filter] duration-200 hover:border-slate-300 hover:shadow-md dark:border-brand-200 dark:bg-brand-50/80 dark:grayscale-0"
    : "overflow-hidden rounded-2xl border border-brand-200/60 bg-surface shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-brand-300 hover:shadow-md";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: finished ? 0.72 : 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduce ? 0 : index * 0.05, ease: "easeOut" }}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      className={cardClassName}
    >
      <Link href={`/matches/${id}`} className="group block p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-brand-900/50">{formatKickoff(kickoffAt)}</span>
          <StatusBadge kickoffAt={kickoffAt} status={status} />
        </div>

        {status === "SCHEDULED" && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium">
            <EditCountdown kickoffAt={kickoffAt} status={status} />
            <span
              className={
                hasMyPrediction
                  ? "rounded-full bg-green-50 px-2.5 py-1 text-green-700"
                  : "rounded-full bg-amber-50 px-2.5 py-1 text-amber-700"
              }
            >
              {hasMyPrediction ? "توقعت" : "لم تتوقع بعد"}
            </span>
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Side team={homeTeam} slotLabel={homeSlotLabel} align="start" />

          {finished ? (
            <motion.div
              initial={reduce ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="rounded-xl bg-brand-600 px-3.5 py-1.5 text-lg font-bold tabular-nums text-white shadow-sm"
            >
              {homeScore} - {awayScore}
            </motion.div>
          ) : (
            <div className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-900/40">
              VS
            </div>
          )}

          <Side team={awayTeam} slotLabel={awaySlotLabel} align="end" />
        </div>
      </Link>

      <PredictionsPanel
        predictions={predictions}
        bestPredictions={bestPredictions}
        hiddenCount={hiddenPredictionCount}
        finished={finished}
        isAdminView={isAdminView}
      />
    </motion.div>
  );
}
