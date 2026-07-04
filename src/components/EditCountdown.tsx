"use client";

import { useMatchLock } from "@/components/ui/Countdown";
import { formatKickoff } from "@/lib/format";
import { lockAt, type LockableStatus } from "@/lib/matchLock";

function formatDuration(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days} يوم ${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function EditCountdown({ kickoffAt, status }: { kickoffAt: Date; status: LockableStatus }) {
  const { locked, secondsToLock } = useMatchLock(kickoffAt, status);

  if (status === "FINISHED") return <span className="text-brand-900/40">انتهت المباراة</span>;
  if (status === "POSTPONED") return <span className="text-amber-700">التوقعات مؤجلة</span>;
  if (status === "CANCELLED") return <span className="text-red-600">ألغيت المباراة</span>;
  if (locked) return <span className="font-semibold text-red-600">انتهى وقت التعديل</span>;

  const urgent = secondsToLock <= 10 * 60;
  const soon = secondsToLock <= 60 * 60;
  const color = urgent ? "text-red-600" : soon ? "text-amber-700" : "text-brand-900/50";

  return (
    <span className={color} title={`يغلق التعديل: ${formatKickoff(lockAt(kickoffAt))}`}>
      التعديل يغلق خلال {formatDuration(secondsToLock)}
    </span>
  );
}
