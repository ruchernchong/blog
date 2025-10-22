import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";
import { StructuredData } from "@/app/(blog)/_components/structured-data";
import Employment from "@/app/(blog)/about/_components/employment";
import globalMetadata from "@/app/(blog)/metadata";
import { openGraphImage, twitterImage } from "@/app/(blog)/shared-metadata";
import Author from "@/components/shared/author";
import { BASE_URL } from "@/config";
import companies from "@/data/companies";

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
    ...openGraphImage,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
    ...twitterImage,
  },
  alternates: {
    canonical,
  },
};

const AboutPage = async () => {
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
        <div className="flex flex-col">
          <Author
            title="About Me"
            tagline={currentPosition}
            description={description}
          />
        </div>
        <hr className="border-zinc-600" />
        <div>
          <Employment companies={sortedCompanies} />
        </div>
        {/*<hr className="border-zinc-600" />*/}
        {/*<div>*/}
        {/*  <Contributions*/}
        {/*    github={githubProfile}*/}
        {/*    stackOverflow={stackOverflowProfile}*/}
        {/*  />*/}
        {/*</div>*/}
      </div>
    </>
  );
};

export default AboutPage;
