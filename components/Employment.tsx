import Image from "next/image";
import classNames from "classnames";
import { BriefcaseIcon } from "@heroicons/react/24/solid";
import { H2 } from "@/components/Typography";

const Employment = ({ companies }) => {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BriefcaseIcon width={32} height={32} className="fill-indigo-300" />
          <H2>Work</H2>
        </div>
        <p className="text-neutral-400">
          Some cool companies I have worked with. Feel free to connect with me
          on&nbsp;
          <a
            href="https://linkedin.com/in/ruchernchong"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 underline hover:text-red-300"
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
                    logo ? "bg-neutral-50" : "bg-transparent"
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
                  {!logo && <BriefcaseIcon className="fill-indigo-300" />}
                </div>
                <div>
                  <a
                    href={url}
                    target="_blank"
                    rel="nofollow noreferrer"
                    className="no-underline"
                  >
                    <div className="absolute -inset-y-4 -inset-x-4 z-0 scale-95 rounded-2xl border border-indigo-300 opacity-0 transition group-hover:scale-100 group-hover:bg-neutral-800/25 group-hover:opacity-100" />
                    <div className="text-xl font-bold">{name}</div>
                  </a>
                  <div>{title}</div>
                  <div className="text-sm italic text-neutral-400">
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
