import { LinkIcon } from "@heroicons/react/24/outline";

interface SpecialLinkProps {
  url: string;
  title?: string;
}

export const LinkWithIcon = ({ url, title }: SpecialLinkProps) => {
  const newUrl = url.replace(/https?:\/\//, "");

  return (
    <a href={url} target="_blank" rel="noopener" className="z-20 no-underline">
      <div className="flex items-center">
        <LinkIcon className="mr-2 h-4 w-4" />
        <span className="hover:text-foreground">{title ?? newUrl}</span>
      </div>
    </a>
  );
};
