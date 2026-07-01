"use client";

import { useEffect, useState } from "react";
import { isLocked, lockAt, type LockableStatus } from "@/lib/matchLock";

export function useMatchLock(kickoffAt: Date, status: LockableStatus) {
  const [locked, setLocked] = useState(() => isLocked(kickoffAt, status));
  const [secondsToLock, setSecondsToLock] = useState(() =>
    Math.max(0, Math.round((lockAt(kickoffAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLocked(isLocked(kickoffAt, status));
      setSecondsToLock(Math.max(0, Math.round((lockAt(kickoffAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [kickoffAt, status]);

  return { locked, secondsToLock };
}

export function Countdown({ kickoffAt, status }: { kickoffAt: Date; status: LockableStatus }) {
  const { locked, secondsToLock } = useMatchLock(kickoffAt, status);

  if (status !== "SCHEDULED") return null;
  if (locked) {
    return <span className="font-medium text-red-600">مقفلة</span>;
  }

  const withinLastHour = secondsToLock < 3600;
  if (!withinLastHour) return null;

  const minutes = Math.floor(secondsToLock / 60);
  const seconds = secondsToLock % 60;
  const urgent = secondsToLock <= 30;

  return (
    <span className={urgent ? "font-medium text-red-600" : "font-medium text-amber-600"}>
      يقفل خلال {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
