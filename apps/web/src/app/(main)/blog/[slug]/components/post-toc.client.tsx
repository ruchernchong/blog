"use client";

import { cn } from "@heroui/react";
import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
}

interface PostTocProps {
  /** Id of the container whose h2 headings populate the table of contents. */
  containerId?: string;
}

export function PostToc({ containerId = "post-body" }: PostTocProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    const nodes = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h2[id]"),
    );
    setHeadings(
      nodes.map((node) => ({ id: node.id, text: node.textContent ?? "" })),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    for (const node of nodes) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [containerId]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="On this page"
      className="sticky top-24 flex w-53 flex-col gap-3"
    >
      <span className="font-mono text-muted text-xs uppercase tracking-widest">
        On this page
      </span>
      <ul className="flex flex-col border-separator border-l">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors",
                heading.id === activeId
                  ? "border-accent font-semibold text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
