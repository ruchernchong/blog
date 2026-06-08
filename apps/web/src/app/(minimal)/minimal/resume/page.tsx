import { Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import companies from "@/data/companies";
import projects from "@/data/projects";
import socials from "@/data/socials";
import { ResumeSaveButton } from "./components/resume-save-button";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Resume for Ru Chern, a software engineer from Singapore building web applications with React, TypeScript, and cloud platforms.",
};

const resumeSkills = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Hono",
  "PostgreSQL",
  "Drizzle ORM",
  "Tailwind CSS",
  "Cloudflare",
  "AWS Lambda",
  "Vercel",
  "Redis",
];

function formatRange(dateStart: string, dateEnd?: string) {
  return `${dateStart} – ${dateEnd ?? "Present"}`;
}

function isGitHubUrl(url: string) {
  try {
    return new URL(url).hostname === "github.com";
  } catch {
    return false;
  }
}

export default function MinimalResumePage() {
  const sortedCompanies = companies.toSorted(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
  );
  const currentRole = sortedCompanies.find(({ dateEnd }) => !dateEnd);
  const allProjects = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];

  return (
    <>
      <style>{`
        @media print {
          header, footer { display: none !important; }
          .minimal-resume-grid { grid-template-columns: 160px 1fr !important; gap: 2rem !important; }
        }
      `}</style>

      <div className="flex flex-col gap-10 py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-4xl text-foreground tracking-tight md:text-5xl">
              Resume.
            </h1>
            {currentRole && (
              <p className="text-lg text-muted">
                {currentRole.title} @ {currentRole.name}
              </p>
            )}
          </div>
          <ResumeSaveButton />
        </div>

        <div className="minimal-resume-grid grid gap-10 md:grid-cols-[220px_1fr] md:gap-16">
          {/* Left — sticky sidebar */}
          <aside className="flex flex-col gap-8 md:sticky md:top-28 md:self-start">
            <div className="flex flex-col gap-1.5">
              <p className="font-bold text-foreground text-xl">Ru Chern</p>
              <p className="text-muted text-sm">Software Engineer</p>
              <div className="flex items-center gap-1.5 text-muted text-sm">
                <HugeiconsIcon
                  icon={Location01Icon}
                  size={14}
                  strokeWidth={2}
                />
                Singapore
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {socials.map(({ name, link }) => (
                <ExternalLink
                  key={name}
                  href={link}
                  aria-label={`Open ${name} profile`}
                  className="flex items-center gap-2 text-muted text-xs transition-colors hover:text-foreground"
                >
                  <Icons.Social name={name} className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {link.replace("https://", "")}
                  </span>
                </ExternalLink>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-semibold text-muted text-xs uppercase tracking-widest">
                Skills
              </p>
              <p className="text-muted text-sm leading-relaxed">
                {resumeSkills.join(" · ")}
              </p>
            </div>
          </aside>

          {/* Right — content */}
          <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-5">
              <h2 className="border-border border-b pb-2 font-semibold text-muted text-xs uppercase tracking-widest">
                Experience
              </h2>
              <div className="flex flex-col gap-6">
                {sortedCompanies.map((company) => (
                  <div
                    key={`${company.name}-${company.dateStart}`}
                    className="grid grid-cols-[6rem_1fr] gap-4 sm:grid-cols-[8rem_1fr]"
                  >
                    <p className="pt-0.5 text-muted text-xs leading-relaxed">
                      {formatRange(company.dateStart, company.dateEnd)}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-semibold text-foreground text-sm">
                        {company.roles?.[0]?.title ?? company.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted text-xs">
                        <ExternalLink
                          href={company.url}
                          className="transition-colors hover:text-foreground"
                        >
                          {company.name}
                        </ExternalLink>
                        <span className="select-none text-border">·</span>
                        <span>{company.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-border" />

            <section className="flex flex-col gap-5">
              <h2 className="border-border border-b pb-2 font-semibold text-muted text-xs uppercase tracking-widest">
                Selected Projects
              </h2>
              <div className="flex flex-col gap-6">
                {allProjects.map((project) => {
                  const liveUrl = project.links.find(
                    (l) => !isGitHubUrl(l as string),
                  ) as string | undefined;
                  const githubUrl = project.links.find((l) =>
                    isGitHubUrl(l as string),
                  ) as string | undefined;

                  return (
                    <div key={project.slug} className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="font-semibold text-foreground text-sm">
                          {project.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {liveUrl && (
                            <ExternalLink
                              href={liveUrl}
                              className="text-muted text-xs transition-colors hover:text-foreground"
                            >
                              Live ↗
                            </ExternalLink>
                          )}
                          {githubUrl && (
                            <ExternalLink
                              href={githubUrl}
                              className="text-muted text-xs transition-colors hover:text-foreground"
                            >
                              GitHub ↗
                            </ExternalLink>
                          )}
                        </div>
                      </div>
                      <p className="text-muted text-xs">
                        {project.skills.join(" · ")}
                      </p>
                      {project.description && (
                        <p className="text-muted text-sm leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
