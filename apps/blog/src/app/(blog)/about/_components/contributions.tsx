import { UserMultipleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fragment } from "react";
import { Card } from "@/components/shared/card";
import { LinkWithIcon } from "@/components/shared/link-with-icon";
import { Typography } from "@/components/typography";
import type { GitHubProfile } from "@/lib/github";
import { cn } from "@/lib/utils";
import type { StackOverflowProfile } from "@/utils/stackoverflow";

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
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={UserMultipleIcon} size={32} strokeWidth={2} />
          <Typography variant="h2">Contributions</Typography>
        </div>
        <Typography variant="body" className="text-muted-foreground">
          My contributions to open-source platforms. I believe that by sharing
          my knowledge and expertise, I can help others to learn and grow too.
        </Typography>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          {github && (
            <div className="flex flex-col gap-2">
              <div>
                <Typography variant="h3">GitHub</Typography>
                <p className="text-sm text-muted-foreground italic">
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
        </Card>
        <Card>
          {stackOverflow && (
            <div className="flex flex-col gap-2">
              <div>
                <Typography variant="h3">Stack Overflow</Typography>
                <p className="text-sm text-muted-foreground italic">
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
                            className={cn(
                              "size-4 rounded-full",
                              STACK_OVERFLOW_BADGES[tier],
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
        </Card>
      </div>
    </section>
  );
};

export default Contributions;
