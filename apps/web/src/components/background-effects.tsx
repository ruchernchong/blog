/**
 * Background Effects Component
 *
 * Adds atmospheric depth with gradient orbs and noise texture.
 * Uses CSS only for performance - no JS animations.
 */
export function BackgroundEffects() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Primary gradient orb - top right */}
      <div
        className="absolute -top-50 -right-25 h-150 w-150 rounded-full bg-rose-400 opacity-[0.15] blur-[120px]"
        style={{ willChange: "transform" }}
      />

      {/* Secondary gradient orb - bottom left */}
      <div
        className="absolute -bottom-50 -left-25 h-125 w-125 rounded-full bg-rose-400 opacity-[0.10] blur-[100px]"
        style={{ willChange: "transform" }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
