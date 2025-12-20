import { UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";
import { StructuredData } from "@/app/(blog)/_components/structured-data";
import Employment from "@/app/(blog)/about/_components/employment";
import globalMetadata from "@/app/(blog)/metadata";
import ExternalLink from "@/components/shared/external-link";
import * as Icons from "@/components/shared/icons";
import { PageTitle } from "@/components/shared/page-title";
import { BASE_URL } from "@/config";
import companies from "@/data/companies";
import socials from "@/data/socials";

const title = "About";
const description =
  "I'm Ru Chern, a frontend developer focused on optimizing performance and delivering excellent user experiences.";
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

export default async function AboutPage() {
  const sortedCompanies = companies.toSorted(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
  );
  const currentPosition = sortedCompanies
    .filter(({ dateEnd }) => !dateEnd)
    .map(({ title, name }) => `${title} @ ${name}`)
    .join(" | ");

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
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-8">
          <PageTitle
            title="About Me"
            description={currentPosition}
            icon={
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <HugeiconsIcon
                  icon={UserIcon}
                  size={20}
                  className="text-primary"
                />
              </div>
            }
          />
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground">{description}</p>
            <div className="flex gap-4">
              {socials.map(({ name, link }) => (
                <ExternalLink
                  key={name}
                  href={link}
                  className="hover:text-foreground"
                >
                  <Icons.Social name={name} className="size-4" />
                </ExternalLink>
              ))}
            </div>
          </div>
        </div>
        <hr className="border-border" />
        <Employment companies={sortedCompanies} />
      </div>
    </>
  );
}
