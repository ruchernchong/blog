import { GetStaticProps, InferGetStaticPropsType } from "next";
import Layout from "@/components/Layout";
import Author from "@/components/Author";
import Contributions from "@/components/Contributions";
import Employment from "@/components/Employment";
import StructuredData from "@/components/StructuredData";
import companies from "@/data/companies";
import { WebPage, WithContext } from "schema-dts";
import { isFeatureEnabled } from "@/lib/isFeatureEnabled";
import { getStackOverflowProfile } from "@/lib/stackoverflow";
import { getGitHubContributions } from "@/lib/github";

const About = ({
  githubProfile,
  stackOverflowProfile,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const sortedCompanies = companies.sort(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
  );
  const currentCompany = sortedCompanies.at(0);
  const currentPosition = `${currentCompany.title} @ ${currentCompany.name}`;

  const pageDescription: string =
    "I am a frontend developer with focus on optimising performance and delivering good user experience. I believe with technology, we are able to change how the way we automate things to make living more efficient and smarter";

  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "About - Ru Chern",
    // TODO: Upgrade description from a single source as variable
    description: pageDescription,
  };

  return (
    <Layout title="About - Ru Chern" description={pageDescription}>
      <StructuredData data={structuredData} />
      <div className="mx-auto mb-16 flex max-w-4xl flex-col items-start justify-center">
        {/*TODO: Upgrade description from a single source as variable*/}
        <Author
          tagline={currentPosition}
          description="I am a frontend developer with focus on optimising performance, delivering good user experience and having worked in the telecommunications, banking and financial services industry. I believe with technology, we are able to change how the way we automate things to make living more efficient and smarter."
        />
      </div>
      <Employment companies={sortedCompanies} />
      {isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_CONTRIBUTIONS) && (
        <>
          <hr className="mb-8 dark:border-neutral-600" />
          <Contributions
            github={githubProfile}
            stackOverflow={stackOverflowProfile}
          />
        </>
      )}
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const githubProfile = await getGitHubContributions();
  const stackOverflowProfile = await getStackOverflowProfile();

  return {
    props: {
      githubProfile,
      stackOverflowProfile,
    },
  };
};

export default About;
