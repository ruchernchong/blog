import Avatar from "@/components/Avatar";
import ExternalLink from "@/components/ExternalLink";
import * as Icons from "@/components/Icons";
import { H1, H2 } from "@/components/Typography";
import { socials } from "@/data/socials";

interface AuthorProps {
  title: string | JSX.Element;
  tagline?: string;
  description?: string;
}

const Author = ({ title, tagline, description }: AuthorProps) => {
  return (
    <div className="flex flex-col-reverse items-center md:flex-row md:items-start md:gap-8">
      <div className="flex grow basis-1/2 flex-col gap-4">
        <div className="flex flex-col items-center md:items-start">
          <H1>{title}</H1>
          {tagline && <H2 className="text-md">{tagline}</H2>}
        </div>
        {description && <p className="text-gray-400">{description}</p>}
        <div className="flex justify-center gap-4 md:justify-start">
          {socials.map(({ name, link }) => {
            return (
              <ExternalLink
                key={name}
                href={link}
                className="hover:text-pink-500"
              >
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
