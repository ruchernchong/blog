import { Fragment } from "react";
import classNames from "classnames";
import { LinkWithIcon } from "@/components/LinkWithIcon";
import { Typography } from "@/components/Typography";
import { StackOverflowProfile } from "@/lib/stackoverflow";
import { GitHubProfile } from "@/lib/github";
import { UsersIcon } from "@heroicons/react/24/solid";

const STACK_OVERFLOW_BADGES: Record<string, string> = {
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
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <UsersIcon width={32} height={32} className="mr-2 fill-pink-500" />
          <h2 className="text-4xl font-bold">Contributions</h2>
        </div>
        <p className="text-gray-400">
          My contributions to open-source platforms. I believe that by sharing
          my knowledge and expertise, I can help others to learn and grow too.
        </p>
      </div>
      <div className="flex flex-col gap-8">
        {github && (
          <div className="flex flex-col gap-2">
            <div>
              <Typography variant="h3">GitHub</Typography>
              <p className="text-sm italic text-gray-400">
                (Powered by GitHub GraphQL API)
              </p>
            </div>
            <div>
              <div>
                Total commits:{" "}
                {github.contributionsCollection.totalCommitContributions}
              </div>
              <div>Pull requests: {github.pullRequests.totalCount}</div>
              <div className="mb-2">
                Followers: {github.followers.totalCount}
              </div>
              <div className="flex flex-col items-start">
                <LinkWithIcon url={github.url} />
              </div>
            </div>
          </div>
        )}
        {stackOverflow && (
          <div className="flex flex-col gap-2">
            <div>
              <Typography variant="h3">Stack Overflow</Typography>
              <p className="text-sm italic text-gray-400">
                (Powered by Stack Exchange API)
              </p>
            </div>
            <div className="flex flex-col gap-2">
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
                          title={tier}
                        />
                        <div>{count}</div>
                      </Fragment>
                    );
                  })}
              </div>
              <div className="flex flex-col items-start">
                <LinkWithIcon url="https://stackoverflow.com/users/4031163/ru-chern-chong" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Contributions;
