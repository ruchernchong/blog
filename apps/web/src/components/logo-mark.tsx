type LogoMarkProps = {
  size?: number;
};

export function LogoMark({ size = 30 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="16" fill="var(--foreground)" />
      <path
        d="M10 11 L15 16 L10 21"
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="17.5"
        y1="21"
        x2="23"
        y2="21"
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
