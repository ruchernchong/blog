import Image from "next/image";
import classNames from "classnames";
import Layout from "components/Layout";
import Author from "components/Author";
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
      <section className="prose prose-neutral mx-auto mb-8 max-w-4xl dark:prose-invert">
        <h2 className="text-2xl font-bold md:text-3xl">Work</h2>
        <div className="mb-8 space-y-4">
          {sortedCompanies.map(
            ({ name, title, logo, dateStart, dateEnd, location, url }) => {
              return (
                <div key={name} className="flex items-center space-x-4">
                  <div
                    className={classNames(
                      "flex h-12 w-12 items-center rounded-2xl p-2 md:h-[72px] md:w-[72px]",
                      logo ? "dark:bg-neutral-50" : "bg-transparent"
                    )}
                  >
                    {logo && (
                      <Image
                        src={logo}
                        width={72}
                        height={72}
                        sizes="100vw"
                        alt={`${name} logo`}
                        priority
                      />
                    )}
                  </div>
                  <div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="no-underline"
                    >
                      <h3 className="duration-250 m-0 text-lg font-semibold transition hover:tracking-wide hover:text-neutral-400 md:text-2xl">
                        {name}
                      </h3>
                    </a>
                    <div className="text-lg">{title}</div>
                    <div className="text-sm">
                      {dateStart} - {dateEnd ?? "Present"}
                    </div>
                    <div className="text-sm">{location}</div>
                  </div>
                </div>
              );
            }
          )}
        </div>
        <p className="text-center dark:text-neutral-400">
          Feel free to connect with me on{" "}
          <a
            href="https://linkedin.com/in/ruchernchong"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </p>
      </section>
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
