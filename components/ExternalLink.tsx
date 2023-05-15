const ExternalLink = ({ href, children }) => {
  return (
    <div className="flex items-center hover:text-neutral-400 dark:text-neutral-400 dark:hover:text-neutral-50">
      <a
        href={href}
        target="_blank"
        rel="noopenner noreferrer"
        aria-label="Link to social media"
        className="flex items-center font-semibold"
      >
        {children}
      </a>
    </div>
  );
};

export default ExternalLink;
