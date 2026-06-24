import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";
import { StructuredData } from "@/app/components/structured-data";
import globalMetadata from "@/app/metadata";
import { AnnotationRail } from "@/components/annotation-rail";
import ExternalLink from "@/components/external-link";
import { Eyebrow } from "@/components/eyebrow";
import * as Icons from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { BASE_URL } from "@/config";
import companies from "@/data/companies";
import socials from "@/data/socials";

const title = "About";
const description =
  "Software engineer from Singapore. Building web applications and writing about the details that matter.";
const canonical = "/about";

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

const structuredData: WithContext<WebPage> = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: `${BASE_URL}${canonical}`,
};

export default function AboutPage() {
  const sortedCompanies = companies.toSorted(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
  );

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="mx-auto flex max-w-3xl flex-col gap-16">
        <PageHeader eyebrow="About" title="Ru Chern" />

        <section className="flex flex-col gap-6">
          <div className="flex max-w-2xl flex-col gap-4 text-muted leading-relaxed">
            <p>{description}</p>
            <p>
              I care about the details that do not show up in a demo: the slow
              query, the flaky test, the cost of a token. I write here to think
              in public and keep myself honest.
            </p>
          </div>
          <div className="flex items-center gap-1">
            {socials.map(({ name, link }) => (
              <ExternalLink
                key={name}
                href={link}
                aria-label={name}
                className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground"
              >
                <Icons.Social name={name} className="size-4" />
              </ExternalLink>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <Eyebrow>Career</Eyebrow>
          <ol className="flex flex-col">
            {sortedCompanies.map((company) => (
              <li
                key={company.name}
                className="flex flex-col gap-2 border-border border-b py-5 first:pt-0 last:border-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="font-display font-medium text-foreground text-lg">
                    {company.title}
                  </h2>
                  <ExternalLink
                    href={company.url}
                    className="font-mono text-accent text-sm hover:underline"
                  >
                    {company.name} ↗
                  </ExternalLink>
                </div>
                <AnnotationRail>
                  <span>
                    {company.dateStart} — {company.dateEnd ?? "Present"}
                  </span>
                  <span>{company.location}</span>
                </AnnotationRail>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
