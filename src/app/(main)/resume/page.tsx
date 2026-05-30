import {
  Briefcase02Icon,
  FileDownloadIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import type { Person, ProfilePage, WithContext } from "schema-dts";
import { ResumeDownloadButton } from "@/app/(main)/resume/components/resume-download-button";
import { StructuredData } from "@/app/components/structured-data";
import globalMetadata from "@/app/metadata";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import { PageTitle } from "@/components/page-title";
import { Badge } from "@/components/ui/badge";
import { BASE_URL, SITE_DESCRIPTION } from "@/config";
import companies from "@/data/companies";
import projects from "@/data/projects";
import socials from "@/data/socials";

const title = "Resume";
const description =
  "Resume for Ru Chern, a software engineer from Singapore building web applications with React, TypeScript, and cloud platforms.";
const canonical = "/resume";

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

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: canonical,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
  },
  alternates: {
    canonical,
  },
};

function ResumeSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="flex break-inside-avoid flex-col gap-4">
      <h2 className="border-border border-b pb-2 font-semibold text-foreground text-sm uppercase tracking-[0.14em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function formatRange(dateStart: string, dateEnd?: string) {
  return `${dateStart} - ${dateEnd ?? "Present"}`;
}

export default function ResumePage() {
  const sortedCompanies = companies.toSorted(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
  );
  const featuredProjects = projects.filter((project) => project.featured);
  const otherProjects = projects.filter((project) => !project.featured);
  const currentRole = sortedCompanies.find((company) => !company.dateEnd);
  const linkedIn = socials.find((social) => social.name === "Linkedin");

  const structuredData: WithContext<ProfilePage> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: title,
    description,
    url: `${BASE_URL}${canonical}`,
    mainEntity: {
      "@type": "Person",
      name: "Ru Chern",
      jobTitle: currentRole?.title ?? "Software Engineer",
      url: BASE_URL,
      sameAs: socials.map((social) => social.link),
    } satisfies Person,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col gap-8 print:gap-5">
        <PageTitle
          title="Resume"
          description={
            currentRole
              ? `${currentRole.title} @ ${currentRole.name}`
              : SITE_DESCRIPTION
          }
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 print:hidden">
              <HugeiconsIcon
                icon={FileDownloadIcon}
                size={20}
                className="text-primary"
              />
            </div>
          }
          action={<ResumeDownloadButton />}
        />

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none">
          <div className="flex flex-col gap-8 print:gap-5">
            <header className="flex flex-col gap-4 border-border border-b pb-6 print:gap-2 print:pb-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-1">
                  <h1 className="font-bold text-4xl text-foreground print:text-3xl print:text-black">
                    Ru Chern
                  </h1>
                  <p className="text-muted-foreground print:text-black">
                    Software engineer in Singapore focused on practical web
                    systems, developer workflows, and product-quality React
                    interfaces.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm print:text-black">
                  <HugeiconsIcon icon={Location01Icon} size={16} />
                  Singapore
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                {socials.map((social) => (
                  <ExternalLink
                    key={social.name}
                    href={social.link}
                    ariaLabel={`Open ${social.name} profile`}
                    className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground print:text-black"
                  >
                    <Icons.Social name={social.name} className="size-4" />
                    {social.link.replace("https://", "")}
                  </ExternalLink>
                ))}
              </div>
            </header>

            <ResumeSection title="Experience">
              <div className="flex flex-col gap-5">
                {sortedCompanies.map((company) => (
                  <div
                    key={`${company.name}-${company.dateStart}`}
                    className="grid gap-2 md:grid-cols-[10rem_1fr] print:grid-cols-[9rem_1fr]"
                  >
                    <div className="text-muted-foreground text-sm print:text-black">
                      {formatRange(company.dateStart, company.dateEnd)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-semibold text-foreground print:text-black">
                          {company.title}
                        </h3>
                        <ExternalLink
                          href={company.url}
                          ariaLabel={`Open ${company.name} website`}
                          className="text-muted-foreground text-sm hover:text-foreground print:text-black"
                        >
                          {company.name}
                        </ExternalLink>
                      </div>
                      <p className="text-muted-foreground text-sm print:text-black">
                        {company.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ResumeSection>

            <ResumeSection title="Selected Projects">
              <div className="flex flex-col gap-5">
                {[...featuredProjects, ...otherProjects].map((project) => (
                  <div key={project.slug} className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-foreground print:text-black">
                        {project.name}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {project.links.map((link) => (
                          <Link
                            key={link}
                            href={link}
                            className="text-muted-foreground transition-colors hover:text-foreground print:text-black"
                          >
                            {String(link).replace("https://", "")}
                          </Link>
                        ))}
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-muted-foreground text-sm print:text-black">
                        {project.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge
                          key={`${project.slug}-${skill}`}
                          variant="secondary"
                          className="print:border print:border-neutral-300 print:bg-white print:text-black"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ResumeSection>

            <div className="grid gap-6 md:grid-cols-[1fr_1fr] print:grid-cols-[1fr_1fr]">
              <ResumeSection title="Core Skills">
                <div className="flex flex-wrap gap-2">
                  {resumeSkills.map((skill) => (
                    <Badge
                      key={skill}
                      className="print:border print:border-neutral-300 print:bg-white print:text-black"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </ResumeSection>

              <ResumeSection title="Focus">
                <div className="flex flex-col gap-3 text-muted-foreground text-sm print:text-black">
                  <p>
                    Building reliable full-stack applications with a preference
                    for typed APIs, fast feedback loops, and maintainable user
                    interfaces.
                  </p>
                  <p>
                    Current work spans banking applications, portfolio systems,
                    analytics dashboards, MCP tooling, and automation workflows.
                  </p>
                </div>
              </ResumeSection>
            </div>

            {linkedIn && (
              <div className="flex items-center gap-2 border-border border-t pt-4 text-muted-foreground text-sm print:text-black">
                <HugeiconsIcon icon={Briefcase02Icon} size={16} />
                Latest profile: {linkedIn.link.replace("https://", "")}
              </div>
            )}
          </div>
        </article>
      </div>
    </>
  );
}
