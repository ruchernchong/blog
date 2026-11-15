import { cn } from "@heroui/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { getPreviewImage } from "@/lib/preview-image";
import type { Project } from "@/types";

export function isGitHubLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "github.com" ||
      parsed.hostname.endsWith(".github.com")
    );
  } catch {
    return false;
  }
}

/** The link a card represents. Prefers the live link over the source. */
function primaryLink(links: string[]): string | undefined {
  return links.find((link) => !isGitHubLink(link)) ?? links[0];
}

/** The mono URL shown in the browser-chrome header. */
function displayUrl(links: string[]): string {
  const primary = primaryLink(links);

  if (!primary) {
    return "";
  }

  try {
    const { hostname, pathname } = new URL(primary);
    return pathname === "/" ? hostname : `${hostname}${pathname}`;
  } catch {
    return primary;
  }
}

const PREVIEW_BARS = [
  { id: "a", height: 42 },
  { id: "b", height: 68 },
  { id: "c", height: 50 },
  { id: "d", height: 84 },
  { id: "e", height: 58 },
  { id: "f", height: 92 },
  { id: "g", height: 72 },
];

async function PreviewPanel({
  project,
  featured,
}: Readonly<{
  project: Project;
  featured: boolean;
}>) {
  const link = primaryLink(project.links);
  // The image the project's own page advertises, as on the landing page.
  const image =
    (link ? await getPreviewImage(link) : null) ?? project.coverImage;

  if (image) {
    return (
      <div className="relative aspect-[1200/630] bg-default/50">
        <Image
          fill
          src={image}
          alt={`${project.name} preview`}
          sizes={
            featured
              ? "(min-width: 1024px) 960px, 100vw"
              : "(min-width: 640px) 480px, 100vw"
          }
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end justify-center gap-2 bg-default/50 p-6",
        featured ? "h-52" : "h-32",
      )}
    >
      {PREVIEW_BARS.map((bar) => (
        <div
          key={bar.id}
          className="w-3 rounded-t bg-accent/60"
          style={{ height: `${bar.height}%` }}
        />
      ))}
    </div>
  );
}

export function ProjectCard({
  project,
  featured = false,
}: Readonly<{
  project: Project;
  featured?: boolean;
}>) {
  const displayedSkills = project.skills.slice(0, 4);
  const remainingCount = project.skills.length - 4;
  const url = displayUrl(project.links);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border transition-transform hover:-translate-y-1",
        featured && "shadow-(--surface-shadow)",
      )}
    >
      <div className="flex items-center gap-1.5 border-separator border-b bg-default/50 px-3 py-2">
        <span className="size-1.5 rounded-full bg-[#ff5f57]" />
        <span className="size-1.5 rounded-full bg-[#febc2e]" />
        <span className="size-1.5 rounded-full bg-[#28c840]" />
        {url && (
          <span className="ml-2 truncate font-mono text-muted text-xs">
            {url}
          </span>
        )}
      </div>

      <PreviewPanel project={project} featured={featured} />

      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "font-bold tracking-tight",
              featured ? "text-xl" : "text-lg",
            )}
          >
            {project.name}
          </h3>
          {featured && (
            <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground text-xs uppercase tracking-wide">
              Featured
            </span>
          )}
        </div>

        {project.description && (
          <p className="text-muted text-sm leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {displayedSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border bg-surface px-3 py-1 font-medium text-xs"
            >
              {skill}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="rounded-full border border-border bg-surface px-3 py-1 font-medium text-muted text-xs">
              +{remainingCount}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          {project.links.map((link) => (
            <Link
              key={link}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-sm underline underline-offset-4 hover:text-muted"
            >
              {isGitHubLink(link) ? "Source" : "Live"}
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={14}
                strokeWidth={2}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
