import ExternalLink from "@/components/ExternalLink";
import * as Icons from "@/components/Icons";
import { socials } from "@/data/socials";

export const Footer = () => (
  <footer className="flex flex-col items-center gap-4 bg-gray-800 py-8">
    <div className="flex items-center gap-x-4">
      {socials.map(({ name, link }) => {
        return (
          <ExternalLink key={name} href={link} className="hover:text-pink-500">
            <Icons.Social name={name} />
          </ExternalLink>
        );
      })}
    </div>
    <div className="flex items-center gap-x-4">
      <div>Chong Ru Chern</div>
      <div>&middot;</div>
      <div>&copy; {new Date().getFullYear()}</div>
    </div>
  </footer>
);
