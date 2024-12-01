import type { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import { openGraphImage, twitterImage } from "@/app/shared-metadata";
import { Author } from "@/components/Author";
import Contributions from "@/components/Contributions";
import Employment from "@/components/Employment";
import { StructuredData } from "@/components/StructuredData";
import companies from "@/data/companies";
import { getStackOverflowProfile } from "@/lib/stackoverflow";
import { getGitHubContributions } from "@/lib/github";
import type { WebPage, WithContext } from "schema-dts";
import { BASE_URL } from "@/config";

const title = "About";
const description =
  "My name is Ru Chern and I am a frontend developer with focus on optimising performance and delivering good user experience. I believe with technology, we are able to change how the way we automate things to make living more efficient and smarter.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: "/about",
    ...openGraphImage,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
    ...twitterImage,
  },
  alternates: {
    canonical: "/about",
  },
};

const AboutPage = async () => {
  const githubProfile = await getGitHubContributions();
  const stackOverflowProfile = await getStackOverflowProfile();

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
    url: `${BASE_URL}/about`,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div
        className="flex flex-col gap-8"
        data-umami-event="page-view"
        data-umami-event-page="about"
      >
        <div
          className="flex flex-col"
          data-umami-event="about-author-view"
          data-umami-event-position={currentPosition}
        >
          <Author
            title="About Me"
            tagline={currentPosition}
            description={description}
          />
        </div>
        <hr className="border-gray-600" />
        <div
          data-umami-event="employment-section-view"
          data-umami-event-companies-count={sortedCompanies.length}
        >
          <Employment companies={sortedCompanies} />
        </div>
        <hr className="border-gray-600" />
        <div
          data-umami-event="contributions-section-view"
          data-umami-event-has-github={!!githubProfile}
          data-umami-event-has-stackoverflow={!!stackOverflowProfile}
        >
          <Contributions
            github={githubProfile}
            stackOverflow={stackOverflowProfile}
          />
        </div>
      </div>
    </>
  );
};

export default AboutPage;
