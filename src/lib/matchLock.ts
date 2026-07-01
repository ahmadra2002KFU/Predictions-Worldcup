export const LOCK_WINDOW_MS = 90_000;

export type LockableStatus = "SCHEDULED" | "FINISHED" | "POSTPONED" | "CANCELLED";

export function lockAt(kickoffAt: Date): Date {
  return new Date(kickoffAt.getTime() - LOCK_WINDOW_MS);
}

export function isLocked(kickoffAt: Date, status: LockableStatus, now: Date = new Date()): boolean {
  if (status !== "SCHEDULED") return true;
  return now >= lockAt(kickoffAt);
}
