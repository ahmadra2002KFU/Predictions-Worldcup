import { getLeaderboardStandings } from "@/lib/leaderboard";
import { LeaderboardTable } from "@/components/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const standings = await getLeaderboardStandings();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">لوحة الصدارة</h1>
      <LeaderboardTable standings={standings} />
    </div>
  );
}
