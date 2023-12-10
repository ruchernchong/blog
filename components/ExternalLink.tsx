import { PropsWithChildren } from "react";

interface ExternalLinkProps extends PropsWithChildren {
  href: string;
}

const ExternalLink = ({ href, children }: ExternalLinkProps) => {
  return (
    <div className="flex items-center text-gray-400 hover:text-pink-500">
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
