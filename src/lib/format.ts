const DISPLAY_TIMEZONE = "Asia/Riyadh";

const dateTimeFormatter = new Intl.DateTimeFormat("ar", {
  timeZone: DISPLAY_TIMEZONE,
  numberingSystem: "latn",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("ar", {
  timeZone: DISPLAY_TIMEZONE,
  numberingSystem: "latn",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatKickoff(date: Date): string {
  return dateTimeFormatter.format(date);
}

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

/** Riyadh has a fixed UTC+3 offset year-round (no DST), so this is a plain arithmetic shift. */
export function toRiyadhLocalInputValue(date: Date): string {
  const riyadh = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const iso = riyadh.toISOString();
  return iso.slice(0, 16);
}
