import Image from "next/image";
import classNames from "classnames";
import { BriefcaseIcon } from "@heroicons/react/24/solid";
import type { Company } from "@/data/companies";

type EmploymentProps = {
  companies: Company[];
};

const Employment = ({ companies }: EmploymentProps) => {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BriefcaseIcon width={32} height={32} className="fill-pink-500" />
          <h2 className="text-4xl font-bold">Work</h2>
        </div>
        <p className="text-gray-400">
          Some cool companies I have worked with. Feel free to connect with me
          on&nbsp;
          <a
            href="https://linkedin.com/in/ruchernchong"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-500 underline hover:text-red-300"
          >
            LinkedIn
          </a>
          .
        </p>
      </div>
      <div className="flex flex-col gap-8">
        {companies.map(
          ({ name, title, logo, dateStart, dateEnd, location, url }) => {
            return (
              <div
                key={name}
                className="group relative flex items-center gap-4"
              >
                <div
                  className={classNames(
                    "flex h-12 w-12 items-center rounded-2xl p-2 md:h-[72px] md:w-[72px]",
                    logo ? "bg-gray-50" : "bg-transparent"
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
                  {!logo && (
                    <BriefcaseIcon
                      width="100%"
                      height="100%"
                      className="fill-pink-500"
                    />
                  )}
                </div>
                <div>
                  <ItemOverlay />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="z-20 no-underline"
                  >
                    <div className="z-20 text-xl font-bold">{name}</div>
                  </a>
                  <div>{title}</div>
                  <div className="text-sm italic text-gray-400">
                    <div>
                      {dateStart} - {dateEnd ?? "Present"}
                    </div>
                    <div>{location}</div>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
};

export default Employment;
