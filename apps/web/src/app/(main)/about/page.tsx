import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import type { WebPage, WithContext } from "schema-dts";
import { AboutHero } from "@/app/(main)/about/components/about-hero";
import { EmploymentTimeline } from "@/app/(main)/about/components/employment-timeline";
import { StatFigure } from "@/app/components/stat-figure";
import { StructuredData } from "@/app/components/structured-data";
import { SurfaceCard } from "@/app/components/surface-card";
import globalMetadata from "@/app/metadata";
import { BASE_URL } from "@/config";
import companies from "@/data/companies";
import projects from "@/data/projects";

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

const yearOf = (date: string) => Number(date.split(" ").at(-1));
const isShippingRole = (companyTitle: string) =>
  /developer|engineer/i.test(companyTitle);

export default async function AboutPage() {
  "use cache";
  cacheLife("days");

  const sortedCompanies = companies.toSorted(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
  );

  const shippingSince = Math.min(
    ...companies
      .filter((c) => isShippingRole(c.title))
      .map((c) => yearOf(c.dateStart)),
  );
  const yearsShipping = new Date().getFullYear() - shippingSince;

  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${BASE_URL}${canonical}`,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <SurfaceCard className="flex flex-col gap-11">
        <AboutHero intro={description} />

        <div className="flex flex-wrap gap-9 border-separator border-y py-6">
          <StatFigure label="years" value={`${yearsShipping}+`} />
          <StatFigure label="roles" value={companies.length} />
          <StatFigure label="projects" value={projects.length} />
        </div>

        <p className="font-semibold text-2xl leading-snug tracking-tight">
          Shipping code by day. Chasing{" "}
          <span className="text-accent">ideas</span> by night.
        </p>

        <EmploymentTimeline companies={sortedCompanies} />
      </SurfaceCard>
    </>
  );
}
