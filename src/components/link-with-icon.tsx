import { Link01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface SpecialLinkProps {
  url: string;
  title?: string;
}

export const LinkWithIcon = ({ url, title }: SpecialLinkProps) => {
  const newUrl = url.replace(/https?:\/\//, "");

  return (
    <a href={url} target="_blank" rel="noopener" className="z-20 no-underline">
      <div className="flex items-center">
        <HugeiconsIcon
          icon={Link01Icon}
          size={16}
          strokeWidth={2}
          className="mr-2"
        />
        <span className="hover:text-foreground">{title ?? newUrl}</span>
      </div>
    </a>
  );
};
