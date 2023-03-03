import Layout from "components/Layout";
import Author from "components/Author";
import Employment from "components/Employment";
import StructuredData from "components/StructuredData";
import companies from "data/companies";
import { WebPage, WithContext } from "schema-dts";
import { isFeatureEnabled } from "lib/isFeatureEnabled";

const About = () => {
  const sortedCompanies = companies.sort(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
  );
  const currentCompany = sortedCompanies.at(0);
  const currentPosition = `${currentCompany.title} @ ${currentCompany.name}`;

  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "About - Ru Chern",
    // TODO: Upgrade description from a single source as variable
    description:
      "I have been writing code since the younger days through exploring and experimenting. I am a frontend developer having worked in the telecommunications, banking and financial services industry. I believe with technology, we are able to change how the way we automate things to make living more efficient and smarter.",
  };

  return (
    <Layout title="About - Ru Chern">
      <StructuredData data={structuredData} />
      <div className="mx-auto mb-16 flex max-w-4xl flex-col items-start justify-center">
        {/*TODO: Upgrade description from a single source as variable*/}
        <Author
          tagline={currentPosition}
          description="I have been writing code since the younger days through exploring and experimenting. I am a frontend developer having worked in the telecommunications, banking and financial services industry. I believe with technology, we are able to change how the way we automate things to make living more efficient and smarter."
        />
      </div>
      <Employment companies={sortedCompanies} />
      {isFeatureEnabled(process.env.NEXT_PUBLIC_FEATURE_CONTRIBUTIONS) && (
        <section className="prose prose-neutral mx-auto mb-8 max-w-4xl dark:prose-invert">
          <h2 className="text-2xl font-bold md:text-3xl">Contributions</h2>
          <div className="mb-8 space-y-4">
            <div className="flex items-center space-x-4">
              <h3 className="m-0 text-lg font-semibold md:text-2xl">GitHub</h3>
            </div>
            <div className="flex items-center space-x-4">
              <h3 className="m-0 text-lg font-semibold md:text-2xl">
                Stack Overflow
              </h3>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default About;
