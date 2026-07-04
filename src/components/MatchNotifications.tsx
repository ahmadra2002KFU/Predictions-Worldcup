"use client";

import { useEffect, useRef, useState } from "react";

interface ApiTeam {
  name: string;
}

interface ApiMatch {
  id: string;
  kickoffAt: string;
  status: "SCHEDULED" | "FINISHED" | "POSTPONED" | "CANCELLED";
  homeTeam: ApiTeam | null;
  awayTeam: ApiTeam | null;
  homeSlotLabel: string | null;
  awaySlotLabel: string | null;
}

const TEN_MINUTES_MS = 10 * 60 * 1000;
const REFRESH_INTERVAL_MS = 60 * 1000;
const SENT_STORAGE_KEY = "matchNotification.sent.v1";
const ENABLED_STORAGE_KEY = "matchNotification.enabled.v1";

function getNotificationSupport() {
  return typeof window !== "undefined" && "Notification" in window;
}

function getSentIds() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(SENT_STORAGE_KEY) ?? "[]"));
  } catch {
    return new Set<string>();
  }
}

function saveSentIds(ids: Set<string>) {
  localStorage.setItem(SENT_STORAGE_KEY, JSON.stringify([...ids]));
}

function teamLabel(match: ApiMatch, side: "home" | "away") {
  if (side === "home") return match.homeTeam?.name ?? match.homeSlotLabel ?? "الفريق الأول";
  return match.awayTeam?.name ?? match.awaySlotLabel ?? "الفريق الثاني";
}

function notifyMatch(match: ApiMatch) {
  const home = teamLabel(match, "home");
  const away = teamLabel(match, "away");
  const kickoff = new Date(match.kickoffAt).toLocaleTimeString("ar", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const notification = new Notification("تذكير بتوقع المباراة", {
    body: `${home} ضد ${away} تبدأ بعد 10 دقائق (${kickoff}). لا تنس توقعك!`,
    tag: `match-${match.id}`,
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = `/matches/${match.id}`;
    notification.close();
  };
}

async function fetchMatches() {
  const res = await fetch("/api/matches", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { matches?: ApiMatch[] };
  return data.matches ?? [];
}

export function MatchNotifications() {
  const supported = getNotificationSupport();
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationSupport() ? Notification.permission : "default"
  );
  const [enabled, setEnabled] = useState(() =>
    getNotificationSupport()
      ? localStorage.getItem(ENABLED_STORAGE_KEY) === "true" && Notification.permission === "granted"
      : false
  );
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!supported || permission !== "granted" || !enabled) return;

    let cancelled = false;

    async function scheduleNotifications() {
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current = [];

      const matches = await fetchMatches();
      if (cancelled) return;

      const now = Date.now();
      const sentIds = getSentIds();

      for (const match of matches) {
        if (match.status !== "SCHEDULED") continue;
        if (sentIds.has(match.id)) continue;

        const notifyAt = new Date(match.kickoffAt).getTime() - TEN_MINUTES_MS;
        const kickoffAt = new Date(match.kickoffAt).getTime();

        // Too early: set a timer. Already inside the 10-minute window: send once now.
        if (notifyAt > now) {
          const delay = notifyAt - now;
          if (delay <= 24 * 60 * 60 * 1000) {
            const timer = window.setTimeout(() => {
              const latestSent = getSentIds();
              if (latestSent.has(match.id) || Notification.permission !== "granted") return;
              notifyMatch(match);
              latestSent.add(match.id);
              saveSentIds(latestSent);
            }, delay);
            timersRef.current.push(timer);
          }
        } else if (kickoffAt > now) {
          notifyMatch(match);
          sentIds.add(match.id);
          saveSentIds(sentIds);
        }
      }
    }

    scheduleNotifications();
    const interval = window.setInterval(scheduleNotifications, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current = [];
    };
  }, [enabled, permission, supported]);

  async function enableNotifications() {
    if (!supported) return;
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    const nextEnabled = nextPermission === "granted";
    setEnabled(nextEnabled);
    localStorage.setItem(ENABLED_STORAGE_KEY, String(nextEnabled));
  }

  function disableNotifications() {
    setEnabled(false);
    localStorage.setItem(ENABLED_STORAGE_KEY, "false");
  }

  if (!supported) return null;

  if (permission === "denied") {
    return null;
  }

  if (enabled && permission === "granted") {
    return (
      <button
        type="button"
        onClick={disableNotifications}
        className="rounded-full border border-brand-200 px-2.5 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-50"
        title="إيقاف تنبيهات المتصفح"
      >
        التنبيهات مفعلة
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={enableNotifications}
      className="rounded-full border border-brand-200 px-2.5 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-50"
      title="تفعيل تنبيه المتصفح قبل المباراة بـ10 دقائق"
    >
      تفعيل التنبيهات
    </button>
  );
}
