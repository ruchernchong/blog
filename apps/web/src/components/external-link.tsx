import type { PropsWithChildren } from "react";

interface ExternalLinkProps extends PropsWithChildren {
  href: string;
  className?: string;
  "aria-label"?: string;
}

const ExternalLink = ({
  href,
  className,
  children,
  "aria-label": ariaLabel = "External link",
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
