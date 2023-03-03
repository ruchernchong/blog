import Image from "next/image";
import classNames from "classnames";

const Employment = ({ companies }) => {
  return (
    <section className="prose prose-neutral mx-auto mb-8 max-w-4xl dark:prose-invert">
      <h2 className="text-2xl font-bold md:text-3xl">Employment</h2>
      <div className="mb-8 space-y-4">
        {companies.map(
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
  );
};

export default Employment;
