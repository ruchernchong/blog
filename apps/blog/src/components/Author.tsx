import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/Icons";
import { Typography } from "@/components/Typography";
import socials from "@/data/socials";

interface Props {
  title: string;
  tagline?: string;
  description?: string;
}

const Author = ({ title, tagline, description }: Props) => {
  return (
    <div className="flex flex-col-reverse items-center md:flex-row md:items-start md:gap-8">
      <div className="flex grow basis-1/2 flex-col gap-4">
        <div className="flex flex-col items-center md:items-start">
          <Typography variant="h1">{title}</Typography>
          {tagline && <Typography variant="h2">{tagline}</Typography>}
        </div>
        {description && <p className="text-zinc-400">{description}</p>}
        <div className="flex justify-center gap-4 md:justify-start">
          {socials.map(({ name, link }) => (
            <ExternalLink
              key={name}
              href={link}
              className="hover:text-pink-500"
            >
              <Icons.Social name={name} className="h-4 w-4" />
            </ExternalLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Author;
