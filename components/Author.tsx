import Avatar from "@/components/Avatar";
import ExternalLink from "@/components/ExternalLink";
import * as Icons from "@/components/Icons";
import { H1 } from "@/components/Typography";
import { socials } from "@/data/socials";

type Author = {
  title: string | JSX.Element;
  tagline?: string;
  description?: string;
};

const Author = ({ title, tagline, description }: Author) => {
  return (
    <div className="flex flex-col-reverse items-center md:flex-row md:items-start md:gap-8">
      <div className="flex grow basis-1/2 flex-col gap-4">
        <div className="flex flex-col items-center md:items-start">
          <H1>{title}</H1>
          {tagline && <div className="text-md">{tagline}</div>}
        </div>
        {description && <p className="text-neutral-400">{description}</p>}
        <div className="flex justify-center gap-4 md:justify-start">
          {socials.map(({ name, link }) => {
            return (
              <ExternalLink key={name} href={link}>
                <Icons.Social name={name} />
              </ExternalLink>
            );
          })}
        </div>
      </div>
      <Avatar />
    </div>
  );
};

export default Author;
