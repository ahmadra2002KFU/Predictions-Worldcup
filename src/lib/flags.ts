const REGIONAL_INDICATOR_BASE = 0x1f1e6; // 🇦
const REGIONAL_INDICATOR_END = 0x1f1ff; // 🇿

/**
 * Convert a flag emoji (two regional-indicator symbols, e.g. "🇪🇸") into its
 * lowercase ISO 3166-1 alpha-2 code (e.g. "es"), which flag-icons uses as a
 * CSS class. Returns null if the input isn't a valid two-letter flag emoji.
 *
 * This lets us render reliable bundled flag images from the existing flagEmoji
 * data without a schema change — and works even on platforms (Windows) that
 * don't render flag emoji natively.
 */
export function flagEmojiToCode(emoji: string | null | undefined): string | null {
  if (!emoji) return null;
  const codePoints = [...emoji].map((ch) => ch.codePointAt(0) ?? 0);
  if (codePoints.length !== 2) return null;
  const inRange = (cp: number) => cp >= REGIONAL_INDICATOR_BASE && cp <= REGIONAL_INDICATOR_END;
  if (!codePoints.every(inRange)) return null;
  return codePoints.map((cp) => String.fromCharCode(cp - REGIONAL_INDICATOR_BASE + 97)).join("");
}

/**
 * Resolve a stored flag value (which may be a flag emoji like "🇪🇸", a plain
 * ISO code like "es", or a flag-icons subdivision code like "gb-eng" for
 * England) into the lowercase code that flag-icons expects. Returns null if it
 * can't be resolved.
 */
export function resolveFlagCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const fromEmoji = flagEmojiToCode(value);
  if (fromEmoji) return fromEmoji;
  const trimmed = value.trim().toLowerCase();
  if (/^[a-z]{2}(-[a-z]{2,3})?$/.test(trimmed)) return trimmed;
  return null;
}

/** Convert an ISO 3166-1 alpha-2 code (e.g. "ES") to its flag emoji (e.g. "🇪🇸"). */
export function codeToFlagEmoji(code: string): string | null {
  const c = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(c)) return null;
  return String.fromCodePoint(
    ...[...c].map((ch) => REGIONAL_INDICATOR_BASE + (ch.charCodeAt(0) - 97))
  );
}

/**
 * Accept either a flag emoji or a 2-letter country code and normalize to a
 * flag emoji for storage. Passes through anything else unchanged.
 */
export function normalizeFlagInput(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z]{2}$/.test(trimmed)) {
    return codeToFlagEmoji(trimmed) ?? trimmed;
  }
  return trimmed;
}
