interface LogoProps {
  /** Rendered pixel size (square). */
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Original app emblem — an abstract faceted purple orb with a football pentagon.
 * Drawn inline as an SVG so it stays crisp at any size and inherits the brand theme.
 * This is a bespoke mark for this app, not a third-party logo.
 */
export function Logo({ size = 64, className, title = "توقعات كأس العالم" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wc-logo-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cb5fbe" />
          <stop offset="0.55" stopColor="#a23b9d" />
          <stop offset="1" stopColor="#6e2569" />
        </linearGradient>
      </defs>

      {/* Faceted hexagonal orb */}
      <path
        d="M32 4 L56.25 18 L56.25 46 L32 60 L7.75 46 L7.75 18 Z"
        fill="url(#wc-logo-body)"
        stroke="#5a1f56"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Top table facet — subtle gem sheen */}
      <path d="M32 4 L56.25 18 L32 32 L7.75 18 Z" fill="#ffffff" opacity="0.14" />

      {/* Ball seams */}
      <g stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.92">
        <line x1="32" y1="22" x2="32" y2="9" />
        <line x1="42.5" y1="29.6" x2="51" y2="21.5" />
        <line x1="38.5" y1="41.9" x2="44" y2="51.5" />
        <line x1="25.5" y1="41.9" x2="20" y2="51.5" />
        <line x1="21.5" y1="29.6" x2="13" y2="21.5" />
      </g>

      {/* Central football pentagon */}
      <path
        d="M32 21 L43 29 L38.75 42 L25.25 42 L21 29 Z"
        fill="#ffffff"
        stroke="#5a1f56"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
