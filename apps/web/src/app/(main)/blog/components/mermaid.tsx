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
            primaryColor: "#F5F5F5",
            primaryTextColor: "#18181B",
            primaryBorderColor: "#18181B",
            lineColor: "#71717A",
            secondaryColor: "#EBEBEC",
            tertiaryColor: "#FFFFFF",
            background: "#F5F5F5",
            mainBkg: "#F5F5F5",
            nodeBorder: "#18181B",
            clusterBkg: "#EBEBEC",
            clusterBorder: "#E4E4E7",
            titleColor: "#18181B",
            edgeLabelBackground: "#FFFFFF",
            textColor: "#18181B",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
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
        <div className="rounded-lg border border-danger/50 bg-danger/10 p-4 text-danger">
          <p className="text-sm">{error}</p>
          <pre className="mt-2 text-xs opacity-70">{chart}</pre>
        </div>
      </figure>
    );
  }

  if (!svg) {
    return (
      <figure className="my-8">
        <div className="h-32 w-full animate-pulse rounded-lg bg-default" />
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
