import classNames from "classnames";
import { StackOverflowProfile } from "lib/getStackOverflowProfile";

const STACK_OVERFLOW_BADGES = {
  bronze: "bg-[#D1A684]",
  silver: "bg-[#B4B8BC]",
  gold: "bg-[#FFCC01]",
};

const Contributions = ({
  stackOverflow,
}: {
  stackOverflow: StackOverflowProfile;
}) => {
  return (
    <section className="prose prose-neutral mx-auto mb-8 max-w-4xl dark:prose-invert">
      <h2 className="text-2xl font-bold md:text-3xl">Contributions</h2>
      <div className="mb-8 space-y-4">
        <div className="flex items-center space-x-4">
          <h3 className="m-0 text-lg font-semibold md:text-2xl">GitHub</h3>
        </div>
        <div className="flex flex-col text-neutral-600 dark:text-neutral-400">
          <h3 className="m-0 text-lg font-semibold md:text-2xl">
            Stack Overflow
          </h3>
          <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
            (Powered by Stack Exchange API)
          </p>
          <div>Reputation: {stackOverflow.reputation}</div>
          {Object.entries(stackOverflow.badge_counts).map(([tier, count]) => {
            return (
              <div key={tier} className="">
                <div className="flex items-center">
                  <div
                    className={classNames(
                      `mr-4 h-4 w-4 rounded-full ${STACK_OVERFLOW_BADGES[tier]}`
                    )}
                  />
                  <div>{count}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Contributions;
