"use client";

import mermaid from "mermaid";
import { useEffect, useId, useRef } from "react";

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

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    mermaid.render(`mermaid-${id.replace(/:/g, "")}`, chart).then(({ svg }) => {
      node.innerHTML = svg;
    });
  }, [chart, id]);

  return (
    <figure>
      <div
        ref={containerRef}
        className="w-full overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full"
      />
    </figure>
  );
}
