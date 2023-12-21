import { PropsWithChildren } from "react";

interface ExternalLinkProps extends PropsWithChildren {
  href: string;
  className?: string;
}

const ExternalLink = ({ href, className, children }: ExternalLinkProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopenner noreferrer nofollow me"
      aria-label="Link to social media"
      className={className}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
