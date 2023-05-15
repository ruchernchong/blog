import classNames from "classnames";
import Avatar from "@/components/Avatar";
import ExternalLink from "@/components/ExternalLink";
import * as Icons from "@/components/Icons";
import { socials } from "@/data/socials";

type Author = {
  title: string | JSX.Element;
  tagline?: string;
  description?: string;
  hideTagline?: boolean;
  hideDescription?: boolean;
};

const Author = ({
  title,
  tagline,
  description,
  hideTagline = false,
  hideDescription = false,
}: Author) => {
  return (
    <div className="mx-auto mb-8 w-full max-w-4xl">
      <div className="flex flex-col-reverse items-center md:flex-row md:items-start">
        <div className="flex grow basis-1/2 flex-col items-center md:items-start md:pr-8">
          <h1
            className={classNames("text-3xl font-bold md:text-4xl", {
              "mb-4": hideTagline,
            })}
          >
            {title}
          </h1>
          {!hideTagline && <div className="text-md mb-4">{tagline}</div>}
          {!hideDescription && (
            <div className="mb-4 text-neutral-600 dark:text-neutral-400">
              {description}
            </div>
          )}
          <div className="flex justify-center gap-x-2 md:justify-start">
            {socials.map(({ name, link }) => {
              return (
                <ExternalLink key={name} href={link}>
                  <Icons.Social key={name} name={name} />
                </ExternalLink>
              );
            })}
          </div>
        </div>
        <Avatar />
      </div>
    </div>
  );
};

export default Author;
