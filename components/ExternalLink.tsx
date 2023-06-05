import { PropsWithChildren } from "react";

interface ExternalLinkProps extends PropsWithChildren {
  href: string;
}

const ExternalLink = ({ href, children }: ExternalLinkProps) => {
  return (
    <div className="flex items-center text-neutral-400 hover:text-indigo-300">
      <a
        href={href}
        target="_blank"
        rel="noopenner noreferrer"
        aria-label="Link to social media"
      >
        {children}
      </a>
    </div>
  );
};

export default ExternalLink;
