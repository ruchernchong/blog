import { PropsWithChildren } from "react";
import classNames from "classnames";

interface Typography extends PropsWithChildren {
  className?: string;
}

export const H1 = ({ className, ...props }: Typography) => {
  return (
    <h1
      className={classNames(
        "inline-block bg-gradient-to-r from-pink-500 via-rose-400 to-orange-300 bg-clip-text text-5xl font-extrabold uppercase text-transparent",
        className
      )}
      {...props}
    />
  );
};

export const H2 = ({ className, ...props }: Typography) => {
  return (
    <h2 className={classNames("text-2xl font-bold", className)} {...props} />
  );
};

export const H3 = ({ className, ...props }: Typography) => {
  return (
    <h3 className={classNames("text-xl font-bold", className)} {...props} />
  );
};
