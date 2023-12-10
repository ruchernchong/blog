import { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import Author from "@/components/Author";
import Contributions from "@/components/Contributions";
import Employment from "@/components/Employment";
import { StructuredData } from "@/components/StructuredData";
import { BASE_URL } from "@/config";
import companies from "@/data/companies.json";
import { WebPage, WithContext } from "schema-dts";
import { getStackOverflowProfile } from "@/lib/stackoverflow";
import { getGitHubContributions } from "@/lib/github";

const title: string = `About`;
const pageDescription: string =
  "My name is Ru Chern and I am a frontend developer with focus on optimising performance and delivering good user experience. I believe with technology, we are able to change how the way we automate things to make living more efficient and smarter.";

export const metadata: Metadata = {
  ...globalMetadata,
  title,
  description: pageDescription,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description: pageDescription,
    url: `${BASE_URL}/about`,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description: pageDescription,
  },
};

const AboutPage = async () => {
  const githubProfile = await getGitHubContributions();
  const stackOverflowProfile = await getStackOverflowProfile();

  const sortedCompanies = companies.sort(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
  );
  const currentPosition = sortedCompanies
    .filter(({ dateEnd }) => !dateEnd)
    .map(({ title, name }) => `${title} @ ${name}`)
    .join(" | ");

  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "About | Ru Chern",
    // TODO: Upgrade description from a single source as variable
    description: pageDescription,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col">
          {/*TODO: Upgrade description from a single source as variable*/}
          <Author
            title="About Me"
            tagline={currentPosition}
            description={pageDescription}
          />
        </div>
        <hr className="border-gray-600" />
        <Employment companies={sortedCompanies} />
        <hr className="border-gray-600" />
        <Contributions
          github={githubProfile}
          stackOverflow={stackOverflowProfile}
        />
      </div>
    </>
  );
};

export default AboutPage;
