import { Fragment } from "react";
import classNames from "classnames";
import { BookmarkIcon, StarIcon } from "@heroicons/react/24/outline";
import { StackOverflowProfile } from "@/lib/getStackOverflowProfile";
import { PinnedRepository } from "@/lib/github";

const STACK_OVERFLOW_BADGES = {
  bronze: "bg-[#D1A684]",
  silver: "bg-[#B4B8BC]",
  gold: "bg-[#FFCC01]",
};

const Contributions = ({
  pinnedRepositories,
  stackOverflow,
}: {
  pinnedRepositories: Partial<PinnedRepository>[];
  stackOverflow: StackOverflowProfile;
}) => {
  return (
    <section className="prose prose-neutral mx-auto mb-8 max-w-4xl dark:prose-invert">
      <h2 className="text-2xl md:text-3xl">Contributions</h2>
      <div className="mb-8 flex flex-col">
        <h3 className="m-0 text-lg font-semibold md:text-2xl">GitHub</h3>
        <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
          (Powered by GitHub GraphQL API)
        </p>
        <h4 className="m-0 mb-4 text-lg">
          <div className="flex flex-row items-center">
            <BookmarkIcon className="mr-2 h-6 w-6" />{" "}
            <span>Pinned repositories</span>
          </div>
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          {pinnedRepositories.map(
            ({ id, name, description, stargazers, url }) => {
              return (
                <a
                  key={id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col rounded-2xl border p-4 no-underline md:border-neutral-600 hover:md:border-neutral-400"
                >
                  <div className="text-xl">{name}</div>
                  <div className="flex-1 text-neutral-600 dark:text-neutral-400">
                    {description}
                  </div>
                  <div className="flex flex-row items-center">
                    <StarIcon className="mr-2 h-4 w-4" />
                    <div>{stargazers.totalCount}</div>
                  </div>
                </a>
              );
            }
          )}
        </div>
      </div>
      <div className="mb-8 flex flex-col text-neutral-600 dark:text-neutral-400">
        <h3 className="m-0 text-lg font-semibold md:text-2xl">
          Stack Overflow
        </h3>
        <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
          (Powered by Stack Exchange API)
        </p>
        <div>Reputation: {stackOverflow.reputation}</div>
        {Object.entries(stackOverflow.badge_counts).map(([tier, count]) => {
          return (
            <Fragment key={tier}>
              <div className="flex items-center">
                <div
                  className={classNames(
                    `mr-4 h-4 w-4 rounded-full ${STACK_OVERFLOW_BADGES[tier]}`
                  )}
                />
                <div>{count}</div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
};

export default Contributions;
