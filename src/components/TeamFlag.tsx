import { resolveFlagCode } from "@/lib/flags";

const SIZES = {
  sm: { width: 24, height: 18 },
  md: { width: 34, height: 25 },
  lg: { width: 52, height: 39 },
} as const;

interface Props {
  flagEmoji: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * Renders a country flag as a bundled image via flag-icons (reliable on every
 * platform, including Windows where flag emoji don't render). Falls back to the
 * raw emoji / a neutral placeholder when the code can't be derived.
 */
export function TeamFlag({ flagEmoji, size = "md", className = "" }: Props) {
  const code = resolveFlagCode(flagEmoji);
  const { width, height } = SIZES[size];

  if (!code) {
    return (
      <span
        className={`inline-block rounded-[3px] bg-brand-100 ${className}`}
        style={{ width, height }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`fi fi-${code} inline-block rounded-[3px] shadow-sm ring-1 ring-black/10 ${className}`}
      style={{ width, height, backgroundSize: "cover", backgroundPosition: "center" }}
      role="img"
    />
  );
}
