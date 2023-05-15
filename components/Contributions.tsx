import { Fragment } from "react";
import classNames from "classnames";
import LinkWithIcon from "@/components/LinkWithIcon";
import { StackOverflowProfile } from "@/lib/stackoverflow";
import { GitHubProfile } from "@/lib/github";

const STACK_OVERFLOW_BADGES = {
  bronze: "bg-[#D1A684]",
  silver: "bg-[#B4B8BC]",
  gold: "bg-[#FFCC01]",
};

const Contributions = ({
  github,
  stackOverflow,
}: {
  github: GitHubProfile;
  stackOverflow: StackOverflowProfile;
}) => {
  return (
    <section className="prose prose-neutral mx-auto max-w-4xl dark:prose-invert">
      <h2 className="text-2xl md:text-3xl">Contributions</h2>
      <div className="mb-8 flex flex-col">
        <h3 className="m-0 text-lg font-semibold md:text-2xl">GitHub</h3>
        <p className="mb-2 text-sm italic text-neutral-600 dark:text-neutral-400">
          (Powered by GitHub GraphQL API)
        </p>
        <div>
          Total commits:{" "}
          {github.contributionsCollection.totalCommitContributions}
        </div>
        <div>Pull requests: {github.pullRequests.totalCount}</div>
        <div className="mb-2">Followers: {github.followers.totalCount}</div>
        <div className="flex flex-col items-start">
          <LinkWithIcon url={github.url} />
        </div>
      </div>
      <div className="flex flex-col text-neutral-600 dark:text-neutral-400">
        <h3 className="m-0 text-lg font-semibold md:text-2xl">
          Stack Overflow
        </h3>
        <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
          (Powered by Stack Exchange API)
        </p>
        <div>Reputation: {stackOverflow.reputation}</div>
        <div className="flex items-center gap-2">
          {Object.entries(stackOverflow.badge_counts)
            .reverse()
            .map(([tier, count]) => {
              return (
                <Fragment key={tier}>
                  <span
                    className={classNames(
                      `h-4 w-4 rounded-full ${STACK_OVERFLOW_BADGES[tier]}`
                    )}
                  />
                  <div>{count}</div>
                </Fragment>
              );
            })}
        </div>
      </div>
    </section>
  );
};

export default Contributions;
