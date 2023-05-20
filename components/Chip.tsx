import { PropsWithChildren } from "react";
import classNames from "classnames";

type Variant = "outlined" | "filled";
type Size = "small" | "medium";

interface TagProps extends PropsWithChildren {
  variant?: Variant;
  size?: Size;
}

const Chip = ({
  variant = "outlined",
  size = "medium",
  ...props
}: TagProps) => {
  return (
    <button
      type="button"
      className={classNames(
        "rounded-full bg-white px-4 py-2 pl-8 text-center text-base font-medium text-blue-700 before:absolute before:-ml-4 before:content-['#'] hover:bg-blue-700 hover:text-white dark:border-indigo-300 dark:bg-neutral-900 dark:text-indigo-300 dark:hover:bg-indigo-300 dark:hover:text-neutral-900",
        {
          "py-1": size === "small",
          "bg-blue-700 text-white dark:bg-indigo-300 dark:text-neutral-900":
            variant === "filled",
          "border border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-indigo-800":
            variant === "outlined",
        }
      )}
      {...props}
    />
  );
};

export default Chip;
