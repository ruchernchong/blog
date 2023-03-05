import classNames from "classnames";
import Avatar from "@/components/Avatar";

type Author = {
  tagline?: string;
  description?: string;
  hideTagline?: boolean;
  hideDescription?: boolean;
};

const Author = ({
  tagline,
  description,
  hideTagline = false,
  hideDescription = false,
}: Author) => {
  return (
    <div className="mx-auto mb-8 w-full max-w-4xl">
      <div className="flex flex-col-reverse items-center md:flex-row md:items-center">
        <div className="flex grow basis-1/2 flex-col items-center md:items-start md:pr-8">
          <h1
            className={classNames(
              "text-3xl font-bold md:text-4xl",
              hideTagline && "mb-4"
            )}
          >
            Ru Chern <span className="uppercase underline">Chong</span>
          </h1>
          {!hideTagline && <div className="text-md mb-4">{tagline}</div>}
          {!hideDescription && (
            <p className="text-neutral-600 dark:text-neutral-400 md:mb-0">
              {description}
            </p>
          )}
        </div>
        <Avatar />
      </div>
    </div>
  );
};

export default Author;
