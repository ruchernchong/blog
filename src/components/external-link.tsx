import type { PropsWithChildren } from "react";

interface ExternalLinkProps extends PropsWithChildren {
  href: string;
  className?: string;
  ariaLabel?: string;
}

const ExternalLink = ({
  href,
  className,
  ariaLabel = "Link to social media",
  children,
}: ExternalLinkProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer nofollow me"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
