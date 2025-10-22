import type { PropsWithChildren } from "react";

interface ExternalLinkProps extends PropsWithChildren {
  href: string;
  className?: string;
  title?: string;
}

const ExternalLink = ({
  href,
  className,
  children,
  title,
}: ExternalLinkProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer nofollow me"
      aria-label="Link to social media"
      className={className}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
