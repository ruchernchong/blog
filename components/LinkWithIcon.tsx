import { LinkIcon } from "@heroicons/react/24/outline";

interface SpecialLinkProps {
  url: string;
}

export const LinkWithIcon = ({ url }: SpecialLinkProps) => {
  const newUrl = url.replace(/https?:\/\//, "");

  return (
    <a href={url} target="_blank" rel="noopener" className="no-underline">
      <div className="flex items-center">
        <LinkIcon className="mr-2 h-4 w-4" />
        <span>{newUrl}</span>
      </div>
    </a>
  );
};
