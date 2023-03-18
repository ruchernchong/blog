import { PropsWithChildren } from "react";
import { LinkIcon } from "@heroicons/react/24/outline";

interface SpecialLinkProps extends PropsWithChildren {
  url: string;
}

const LinkWithIcon = ({ url }: SpecialLinkProps) => {
  const newUrl = url.replace(/https?:\/\//, "");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline"
    >
      <div className="flex items-center">
        <LinkIcon className="mr-2 h-4 w-4" />
        <div>{newUrl}</div>
      </div>
    </a>
  );
};

export default LinkWithIcon;
