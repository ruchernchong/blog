import { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import Author from "@/components/Author";
import Contributions from "@/components/Contributions";
import Employment from "@/components/Employment";
import StructuredData from "@/components/StructuredData";
import { HOST_URL } from "@/config";
import companies from "@/data/companies";
import { WebPage, WithContext } from "schema-dts";
import { getStackOverflowProfile } from "@/lib/stackoverflow";
import { getGitHubContributions } from "@/lib/github";

const pageDescription: string =
  "I am a frontend developer with focus on optimising performance and delivering good user experience. I believe with technology, we are able to change how the way we automate things to make living more efficient and smarter";

export const metadata: Metadata = {
  ...globalMetadata,
  title: "About",
  description: pageDescription,
  openGraph: {
    ...globalMetadata.openGraph,
    title: "About | Ru Chern",
    description: pageDescription,
    url: `${HOST_URL}/about`,
  },
  twitter: {
    ...globalMetadata.twitter,
    title: "About | Ru Chern",
    description: pageDescription,
  },
};

const AboutPage = async () => {
  const githubProfile = await getGitHubContributions();
  const stackOverflowProfile = await getStackOverflowProfile();

  const sortedCompanies = companies.sort(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
  );
  const currentCompany = sortedCompanies[0];
  let currentPosition: string = "";
  if (currentCompany) {
    currentPosition = `${currentCompany.title} @ ${currentCompany.name}`;
  }

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
      <div className="mx-auto mb-8 flex max-w-4xl flex-col items-start justify-center">
        {/*TODO: Upgrade description from a single source as variable*/}
        <Author
          title="About Me"
          tagline={currentPosition}
          description="My name is Ru Chern and I am a frontend developer with focus on optimising performance, delivering good user experience and having worked in the telecommunications, banking and financial services industry. I believe with technology, we are able to change how the way we automate things to make living more efficient and smarter."
        />
      </div>
      <Employment companies={sortedCompanies} />
      <hr className="mb-8 dark:border-neutral-600" />
      <Contributions
        github={githubProfile}
        stackOverflow={stackOverflowProfile}
      />
    </>
  );
};

export default AboutPage;
