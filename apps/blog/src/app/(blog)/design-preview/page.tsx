"use client";

import type { CSSProperties } from "react";

// Final choice: Coral
const accentColour = {
  name: "Coral",
  primary: "oklch(0.60 0.18 25)",
  primaryForeground: "oklch(0.98 0.01 25)",
  ring: "oklch(0.70 0.15 25)",
  gradient: "from-rose-500/20 to-orange-500/20",
  orbColour: "bg-rose-400",
};

type EffectLevel = "none" | "subtle" | "moderate" | "bold";

export default function DesignPreviewPage() {
  const effectLevel = "moderate" as EffectLevel; // Locked in
  const currentAccent = accentColour; // Coral - locked in

  const effectOpacity = {
    none: 0,
    subtle: 0.08,
    moderate: 0.15,
    bold: 0.25,
  };

  const noiseOpacity = {
    none: 0,
    subtle: 0.02,
    moderate: 0.04,
    bold: 0.06,
  };

  return (
    <div
      className="min-h-screen"
      style={
        {
          "--preview-primary": currentAccent.primary,
          "--preview-primary-foreground": currentAccent.primaryForeground,
          "--preview-ring": currentAccent.ring,
          "--preview-background": "oklch(0.985 0.005 90)",
          "--preview-foreground": "oklch(0.15 0.01 270)",
          "--preview-card": "oklch(1 0 0)",
          "--preview-muted": "oklch(0.96 0.005 90)",
          "--preview-muted-foreground": "oklch(0.45 0.01 270)",
          "--preview-border": "oklch(0.90 0.005 90)",
        } as CSSProperties
      }
    >
      {/* Background Effects */}
      {effectLevel !== "none" && (
        <>
          {/* Gradient Orbs */}
          <div
            className={`pointer-events-none fixed top-[-200px] right-[-100px] h-[600px] w-[600px] rounded-full ${currentAccent.orbColour} blur-[120px]`}
            style={{ opacity: effectOpacity[effectLevel] }}
          />
          <div
            className={`pointer-events-none fixed bottom-[-200px] left-[-100px] h-[500px] w-[500px] rounded-full ${currentAccent.orbColour} blur-[100px]`}
            style={{ opacity: effectOpacity[effectLevel] * 0.7 }}
          />

          {/* Noise Texture */}
          <div
            className="pointer-events-none fixed inset-0 bg-repeat mix-blend-overlay"
            style={{
              opacity: noiseOpacity[effectLevel],
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </>
      )}

      {/* Controls Panel */}
      <div className="sticky top-0 z-50 border-b bg-white/90 px-6 py-4 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-4 font-bold text-2xl tracking-tight">
            Design Preview
          </h1>

          <div className="flex items-center gap-4">
            <span
              className="rounded-full px-4 py-2 font-medium text-sm text-white shadow-lg"
              style={{ backgroundColor: currentAccent.primary }}
            >
              {currentAccent.name}
            </span>
            <span className="text-muted-foreground text-sm">
              + Moderate Effects — Locked in ✓
            </span>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div
        className="relative px-6 py-12"
        style={{ backgroundColor: "var(--preview-background)" }}
      >
        <div className="mx-auto max-w-5xl">
          {/* Hero Section Preview */}
          <section className="mb-16">
            <h2 className="mb-6 font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Hero Section
            </h2>
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4">
                <h1
                  className="font-bold text-5xl tracking-tight"
                  style={{
                    color: "var(--preview-foreground)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Chong Ru Chern
                </h1>
                <p
                  className="max-w-xl text-lg leading-relaxed"
                  style={{ color: "var(--preview-muted-foreground)" }}
                >
                  Software Engineer based in Singapore, passionate about
                  building products that make a difference.
                </p>
                <div className="flex gap-3">
                  {["GitHub", "LinkedIn", "Twitter"].map((social) => (
                    <span
                      key={social}
                      className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                      style={{
                        backgroundColor: "var(--preview-muted)",
                        color: "var(--preview-muted-foreground)",
                      }}
                    >
                      ●
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Cards Preview */}
          <section className="mb-16">
            <h2 className="mb-6 font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Cards
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Blog Post Card */}
              <div
                className="group cursor-pointer rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: "var(--preview-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 8px 30px -10px ${currentAccent.primary}40`;
                  e.currentTarget.style.borderColor = currentAccent.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "";
                  e.currentTarget.style.borderColor = "var(--preview-border)";
                }}
              >
                <div className="flex flex-col gap-3">
                  <span
                    className="text-sm italic"
                    style={{ color: "var(--preview-muted-foreground)" }}
                  >
                    Friday, 20 December 2024
                  </span>
                  <h3
                    className="font-semibold text-xl"
                    style={{ color: "var(--preview-foreground)" }}
                  >
                    Building a Modern Portfolio with Next.js 15
                  </h3>
                  <p style={{ color: "var(--preview-muted-foreground)" }}>
                    A deep dive into the latest features and best practices for
                    creating a standout developer portfolio.
                  </p>
                </div>
              </div>

              {/* Project Card */}
              <div
                className="group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: "var(--preview-border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 8px 30px -10px ${currentAccent.primary}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div
                  className={`h-40 bg-gradient-to-br ${currentAccent.gradient}`}
                />
                <div className="p-6">
                  <h3
                    className="mb-2 font-semibold text-lg"
                    style={{ color: "var(--preview-foreground)" }}
                  >
                    SG Car Trends
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--preview-muted-foreground)" }}
                  >
                    Analytics dashboard for Singapore car market trends.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Buttons Preview */}
          <section className="mb-16">
            <h2 className="mb-6 font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Buttons
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className="rounded-full px-6 py-3 font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  backgroundColor: "var(--preview-primary)",
                  color: "var(--preview-primary-foreground)",
                }}
              >
                Primary Button
              </button>
              <button
                type="button"
                className="rounded-full border-2 px-6 py-3 font-medium text-sm transition-all duration-200 hover:scale-[1.02]"
                style={{
                  borderColor: "var(--preview-primary)",
                  color: "var(--preview-primary)",
                  backgroundColor: "transparent",
                }}
              >
                Outline Button
              </button>
              <button
                type="button"
                className="rounded-full px-6 py-3 font-medium text-sm transition-all duration-200 hover:scale-[1.02]"
                style={{
                  backgroundColor: "var(--preview-muted)",
                  color: "var(--preview-foreground)",
                }}
              >
                Secondary Button
              </button>
              <button
                type="button"
                className="rounded-full px-6 py-3 font-medium text-sm transition-all duration-200 hover:underline"
                style={{
                  color: "var(--preview-primary)",
                  backgroundColor: "transparent",
                }}
              >
                Ghost Button
              </button>
            </div>
          </section>

          {/* Badges Preview */}
          <section className="mb-16">
            <h2 className="mb-6 font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Badges & Tags
            </h2>
            <div className="flex flex-wrap gap-3">
              {["Next.js", "TypeScript", "Tailwind", "React", "Node.js"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-4 py-1.5 font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "var(--preview-primary)",
                      color: "var(--preview-primary-foreground)",
                    }}
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {["Draft", "Published", "Featured"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-4 py-1.5 font-medium text-sm"
                  style={{
                    borderColor: "var(--preview-border)",
                    color: "var(--preview-muted-foreground)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Navigation Preview */}
          <section className="mb-16">
            <h2 className="mb-6 font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Navigation
            </h2>
            <div
              className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm"
              style={{ borderColor: "var(--preview-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full font-bold"
                  style={{
                    backgroundColor: "var(--preview-primary)",
                    color: "var(--preview-primary-foreground)",
                  }}
                >
                  R
                </div>
                <span
                  className="font-semibold"
                  style={{ color: "var(--preview-foreground)" }}
                >
                  Ru Chern
                </span>
              </div>
              <nav className="flex gap-6">
                {["Home", "Blog", "Projects", "About"].map((link, i) => (
                  <span
                    key={link}
                    className="relative cursor-pointer font-medium text-sm transition-colors"
                    style={{
                      color:
                        i === 0
                          ? "var(--preview-foreground)"
                          : "var(--preview-muted-foreground)",
                    }}
                  >
                    {link}
                    {i === 0 && (
                      <span
                        className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full"
                        style={{ backgroundColor: "var(--preview-primary)" }}
                      />
                    )}
                  </span>
                ))}
              </nav>
            </div>
          </section>

          {/* Typography Scale Preview */}
          <section className="mb-16">
            <h2 className="mb-6 font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Typography Scale
            </h2>
            <div
              className="rounded-2xl border bg-white p-8 shadow-sm"
              style={{ borderColor: "var(--preview-border)" }}
            >
              <div className="flex flex-col gap-4">
                <h1
                  className="font-bold text-5xl tracking-tight"
                  style={{
                    color: "var(--preview-foreground)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Heading 1 (5xl)
                </h1>
                <h2
                  className="font-semibold text-3xl tracking-tight"
                  style={{ color: "var(--preview-foreground)" }}
                >
                  Heading 2 (3xl)
                </h2>
                <h3
                  className="font-semibold text-xl"
                  style={{ color: "var(--preview-foreground)" }}
                >
                  Heading 3 (xl)
                </h3>
                <p
                  className="text-lg leading-relaxed"
                  style={{ color: "var(--preview-muted-foreground)" }}
                >
                  Body large - Used for introductions and important paragraphs.
                  The serif font adds editorial character.
                </p>
                <p style={{ color: "var(--preview-muted-foreground)" }}>
                  Body regular - The default body text size, optimised for
                  readability with increased line height.
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--preview-muted-foreground)" }}
                >
                  Body small - Used for captions, metadata, and secondary
                  information.
                </p>
              </div>
            </div>
          </section>

          {/* Selection Summary */}
          <section className="rounded-2xl border-2 border-dashed bg-white/50 p-8">
            <h2
              className="mb-4 font-semibold text-xl"
              style={{ color: "var(--preview-foreground)" }}
            >
              Your Selection
            </h2>
            <div className="flex flex-col gap-2">
              <p
                className="font-semibold text-xl"
                style={{ color: currentAccent.primary }}
              >
                {currentAccent.name} + Moderate Effects
              </p>
              <p className="text-muted-foreground">
                Typography: Sans-only (Figtree)
              </p>
            </div>
            <p className="mt-6 font-medium text-foreground">
              Ready to apply these styles across the entire portfolio?
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
