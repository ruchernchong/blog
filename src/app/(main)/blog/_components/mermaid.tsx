"use client";

import mermaid from "mermaid";
import { useEffect, useId, useRef } from "react";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
});

interface MermaidProps {
  chart: string;
}

export const Mermaid = ({ chart }: MermaidProps) => {
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
};
