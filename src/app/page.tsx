import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/session";
import { RegisterForm } from "@/components/RegisterForm";
import { LogoutButton } from "@/components/LogoutButton";
import { Logo } from "@/components/Logo";
import { TeamFlag } from "@/components/TeamFlag";
import { EditCountdown } from "@/components/EditCountdown";
import { formatKickoff } from "@/lib/format";
import { isLocked } from "@/lib/matchLock";
import { STAGE_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

type MatchWithMine = Awaited<ReturnType<typeof getMatchesWithMyPredictions>>[number];

function getMatchesWithMyPredictions(participantId: string) {
  return prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: { participantId },
        take: 1,
      },
    },
  });
}

function PredictionMatchRow({ match }: { match: MatchWithMine }) {
  const prediction = match.predictions[0] ?? null;
  const finished = match.status === "FINISHED";
  const locked = isLocked(match.kickoffAt, match.status);
  const canPredict = match.status === "SCHEDULED" && Boolean(match.homeTeam && match.awayTeam) && !locked;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-brand-100 bg-surface p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
          {STAGE_LABELS[match.stage]}
        </span>
        <span className="text-brand-900/50">{formatKickoff(match.kickoffAt)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center justify-end gap-2 text-end">
          <span className="truncate text-sm font-semibold text-brand-900">{match.homeTeam?.name ?? match.homeSlotLabel ?? "غير محدد"}</span>
          <TeamFlag flagEmoji={match.homeTeam?.flagEmoji ?? null} />
        </div>
        <div className="rounded-full border border-brand-200 px-3 py-1 text-xs font-bold text-brand-900/50">
          {finished ? `${match.homeScore} - ${match.awayScore}` : "VS"}
        </div>
        <div className="flex min-w-0 items-center justify-start gap-2 text-start">
          <TeamFlag flagEmoji={match.awayTeam?.flagEmoji ?? null} />
          <span className="truncate text-sm font-semibold text-brand-900">{match.awayTeam?.name ?? match.awaySlotLabel ?? "غير محدد"}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        {match.status === "SCHEDULED" ? (
          <EditCountdown kickoffAt={match.kickoffAt} status={match.status} />
        ) : (
          <span className="text-brand-900/40">{finished ? "انتهت" : "غير متاحة حالياً"}</span>
        )}

        {prediction ? (
          <span className="rounded-full bg-green-50 px-2.5 py-1 font-semibold text-green-700">
            توقعك: {prediction.predHomeScore} - {prediction.predAwayScore}
            {finished ? ` · ${prediction.pointsTotal} نقطة` : ""}
          </span>
        ) : canPredict ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">لم تتوقع بعد</span>
        ) : (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">لا يوجد توقع</span>
        )}
      </div>
    </Link>
  );
}

function PredictionSection({ title, matches, empty }: { title: string; matches: MatchWithMine[]; empty: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-brand-700">{title}</h2>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">{matches.length}</span>
      </div>
      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((match) => (
            <PredictionMatchRow key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-brand-100 bg-surface p-4 text-center text-sm text-brand-900/50">{empty}</p>
      )}
    </section>
  );
}

export default async function Home() {
  const participant = await getCurrentParticipant();

  if (!participant) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-surface px-6 py-24 text-center">
        <Logo size={104} />
        <h1 className="text-3xl font-bold text-brand-700">توقعات كأس العالم مع مفيد</h1>
        <p className="max-w-md text-brand-900/70">
          سجّل اسمك، توقع نتائج المباريات، وتنافس في لوحة الصدارة.
        </p>
        <RegisterForm />
        <Link href="/recover" className="text-sm text-brand-600 underline">
          نسيت حسابك؟ استرجعه هنا
        </Link>
      </div>
    );
  }

  const matches = await getMatchesWithMyPredictions(participant.id);
  const now = new Date();
  const scheduledPlayable = matches.filter((match) =>
    match.status === "SCHEDULED" && Boolean(match.homeTeam && match.awayTeam) && !isLocked(match.kickoffAt, match.status)
  );
  const missingPredictions = scheduledPlayable.filter((match) => match.predictions.length === 0);
  const upcomingPredictions = matches.filter((match) => match.status === "SCHEDULED" && match.predictions.length > 0);
  const previousPredictions = matches.filter((match) => match.status !== "SCHEDULED" && match.predictions.length > 0);
  const totalPoints = matches.reduce((sum, match) => sum + (match.predictions[0]?.pointsTotal ?? 0), 0);
  const todayOpen = scheduledPlayable.filter((match) => match.kickoffAt <= new Date(now.getTime() + 24 * 60 * 60 * 1000));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-6 py-10">
      <section className="rounded-3xl border border-brand-100 bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-brand-900/60">أهلاً بك</p>
            <h1 className="text-2xl font-bold text-brand-700">{participant.displayName}</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-brand-50 p-3">
            <div className="text-xl font-bold text-brand-700">{totalPoints}</div>
            <div className="text-[11px] text-brand-900/50">نقاطك</div>
          </div>
          <div className="rounded-2xl bg-brand-50 p-3">
            <div className="text-xl font-bold text-brand-700">{upcomingPredictions.length}</div>
            <div className="text-[11px] text-brand-900/50">توقع قادم</div>
          </div>
          <div className="rounded-2xl bg-amber-50 p-3">
            <div className="text-xl font-bold text-amber-700">{missingPredictions.length}</div>
            <div className="text-[11px] text-amber-900/60">ناقص</div>
          </div>
        </div>

        {todayOpen.length > 0 && (
          <Link
            href="/matches"
            className="mt-4 block rounded-2xl bg-brand-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-700"
          >
            لديك {todayOpen.length} مباراة متاحة اليوم — راجع توقعاتك
          </Link>
        )}
      </section>

      <PredictionSection
        title="توقعاتي القادمة"
        matches={upcomingPredictions}
        empty="لا توجد توقعات قادمة محفوظة بعد."
      />
      <PredictionSection
        title="مباريات لم أتوقعها بعد"
        matches={missingPredictions}
        empty="كل المباريات المتاحة حالياً لها توقعات محفوظة."
      />
      <PredictionSection
        title="نتائجي السابقة"
        matches={previousPredictions}
        empty="لا توجد نتائج سابقة لتوقعاتك بعد."
      />
    </div>
  );
}
