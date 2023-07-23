import { PropsWithChildren } from "react";
import classNames from "classnames";

interface Typography extends PropsWithChildren {
  className?: string;
}

export const H1 = ({ className, ...props }: Typography) => {
  return (
    <h1
      className={classNames("text-3xl font-extrabold md:text-4xl", className)}
      {...props}
    />
  );
};

export const H2 = ({ className, ...props }: Typography) => {
  return (
    <h2
      className={classNames("text-3xl font-bold md:text-4xl", className)}
      {...props}
    />
  );
};

export const H3 = ({ className, ...props }: Typography) => {
  return (
    <h3 className={classNames("text-2xl font-medium", className)} {...props} />
  );
};

export default {
  H1,
  H2,
  H3,
};
