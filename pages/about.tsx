import Image from "next/image";
import classNames from "classnames";

import Container from "components/Container";
import Author from "components/Author";

import companies from "data/companies";

const About = () => {
  return (
    <Container title="About - Ru Chern">
      <div className="mx-auto mb-16 flex max-w-4xl flex-col items-start justify-center">
        <Author />
      </div>
      <section className="prose prose-neutral mx-auto mb-12 max-w-4xl dark:prose-invert md:mb-16">
        <h2 className="text-2xl font-bold md:text-3xl">Work</h2>
        <div className="mb-12 space-y-4 md:mb-16">
          {companies.map(
            ({ name, logo, dateStart, dateEnd, location, url }) => {
              return (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-4 no-underline"
                >
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
                      />
                    )}
                  </div>
                  <div className="">
                    <h3 className="m-0 text-lg font-semibold transition-all hover:tracking-wide hover:text-neutral-400 md:text-2xl">
                      {name}
                    </h3>
                    <div className="text-sm">
                      {dateStart} - {dateEnd ?? "Present"}
                    </div>
                    <div className="text-sm">{location}</div>
                  </div>
                </a>
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
    </Container>
  );
};

export default About;
