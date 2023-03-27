import { PropsWithChildren } from "react";
import classNames from "classnames";

type Variant = "outlined" | "filled";
type Size = "small" | "medium";

interface TagProps extends PropsWithChildren {
  variant?: Variant;
  size?: Size;
}

const Tag = ({ variant = "outlined", size = "medium", ...props }: TagProps) => {
  return (
    <button
      type="button"
      className={classNames(
        "rounded-full bg-white px-4 py-2 pl-8 text-center text-base font-medium text-blue-700 before:absolute before:-ml-4 before:content-['#'] hover:bg-blue-700 hover:text-white dark:border-blue-500 dark:bg-neutral-900 dark:text-blue-500 dark:hover:bg-blue-500 dark:hover:text-white",
        {
          "py-1": size === "small",
          "bg-blue-700 text-white dark:bg-blue-500 dark:text-white":
            variant === "filled",
          "border border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800":
            variant === "outlined",
        }
      )}
      {...props}
    />
  );
};

export default Tag;
