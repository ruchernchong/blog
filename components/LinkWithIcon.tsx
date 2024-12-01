import { LinkIcon } from "@heroicons/react/24/outline";

interface SpecialLinkProps {
  url: string;
  title?: string;
}

export const LinkWithIcon = ({ url, title }: SpecialLinkProps) => {
  const newUrl = url.replace(/https?:\/\//, "");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="z-20 no-underline"
      data-umami-event="icon-link-click"
      data-umami-event-url={url}
      data-umami-event-title={title || newUrl}
    >
      <div className="flex items-center">
        <LinkIcon
          className="mr-2 h-4 w-4"
          data-umami-event="icon-interaction"
          data-umami-event-type="link-icon"
          data-umami-event-url={url}
        />
        <span className="hover:text-pink-500">{title ?? newUrl}</span>
      </div>
    </a>
  );
};
