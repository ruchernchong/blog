"use client";

import { useEffect, useId, useRef, useState } from "react";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Dynamic import - only loads on client when component mounts
    // This avoids Date.now() execution during static generation
    import("mermaid")
      .then((mermaidModule) => {
        if (cancelled) return;

        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          themeVariables: {
            primaryColor: "#FAF9F7",
            primaryTextColor: "#1F1F23",
            primaryBorderColor: "#E07356",
            lineColor: "#E07356",
            secondaryColor: "#F3F2F0",
            tertiaryColor: "#FDF8F7",
            background: "#FAF9F7",
            mainBkg: "#FAF9F7",
            nodeBorder: "#E07356",
            clusterBkg: "#F3F2F0",
            clusterBorder: "#E5E4E2",
            titleColor: "#1F1F23",
            edgeLabelBackground: "#FAF9F7",
            textColor: "#1F1F23",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          },
        });

        return mermaid.render(`mermaid-${id.replace(/:/g, "")}`, chart);
      })
      .then((result) => {
        if (!cancelled && result) {
          setSvg(result.svg);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to render mermaid diagram:", err);
          setError("Failed to render diagram");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <figure className="my-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="text-sm">{error}</p>
          <pre className="mt-2 text-xs opacity-70">{chart}</pre>
        </div>
      </figure>
    );
  }

  if (!svg) {
    return (
      <figure className="my-8">
        <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
      </figure>
    );
  }

  return (
    <figure className="my-8">
      <div
        ref={containerRef}
        className="w-full overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG from mermaid is trusted content
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </figure>
  );
}
