import { Fragment } from "react";
import classNames from "classnames";
import Card from "@/components/Card";
import { LinkWithIcon } from "@/components/LinkWithIcon";
import { Typography } from "@/components/Typography";
import type { StackOverflowProfile } from "@/lib/stackoverflow";
import type { GitHubProfile } from "@/lib/github";
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
    <section
      className="flex flex-col gap-8"
      data-umami-event="contributions-section-view"
    >
      <div
        className="flex flex-col gap-4"
        data-umami-event="contributions-header-view"
      >
        <div className="flex items-center gap-x-2">
          <UsersIcon className="h-8 w-8 fill-pink-500" />
          <Typography variant="h2">Contributions</Typography>
        </div>
        <Typography variant="p" className="text-zinc-400">
          My contributions to open-source platforms. I believe that by sharing
          my knowledge and expertise, I can help others to learn and grow too.
        </Typography>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          {github && (
            <div
              className="flex flex-col gap-2"
              data-umami-event="github-stats-view"
              data-umami-event-commits={
                github.contributionsCollection.totalCommitContributions
              }
              data-umami-event-prs={github.pullRequests.totalCount}
              data-umami-event-followers={github.followers.totalCount}
            >
              <div>
                <Typography variant="h3">GitHub</Typography>
                <p className="text-sm italic text-zinc-400">
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
                  <LinkWithIcon
                    url={github.url}
                    data-umami-event="github-profile-click"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
        <Card>
          {stackOverflow && (
            <div
              className="flex flex-col gap-2"
              data-umami-event="stackoverflow-stats-view"
              data-umami-event-reputation={stackOverflow.reputation}
            >
              <div>
                <Typography variant="h3">Stack Overflow</Typography>
                <p className="text-sm italic text-zinc-400">
                  (Powered by Stack Exchange API)
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div>Reputation: {stackOverflow.reputation}</div>
                <div
                  className="flex items-center gap-2"
                  data-umami-event="stackoverflow-badges-view"
                >
                  {Object.entries(stackOverflow.badge_counts)
                    .reverse()
                    .map(([tier, count]) => {
                      return (
                        <Fragment key={tier}>
                          <span
                            className={classNames(
                              `h-4 w-4 rounded-full ${STACK_OVERFLOW_BADGES[tier]}`,
                            )}
                            title={tier}
                            data-umami-event="stackoverflow-badge-view"
                            data-umami-event-tier={tier}
                            data-umami-event-count={count}
                          />
                          <div>{count}</div>
                        </Fragment>
                      );
                    })}
                </div>
                <div className="flex flex-col items-start">
                  <LinkWithIcon
                    url="https://stackoverflow.com/users/4031163/ru-chern-chong"
                    data-umami-event="stackoverflow-profile-click"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default Contributions;
