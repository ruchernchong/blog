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
        "rounded-full px-4 py-2 pl-8 text-center text-base font-medium before:absolute before:-ml-4 before:content-['#']",
        {
          "py-1": size === "small",
          "border border-transparent bg-indigo-300 text-neutral-900 hover:border hover:border-indigo-300 hover:bg-neutral-900 hover:text-indigo-300":
            variant === "filled",
          "border border-indigo-300 bg-neutral-900 text-indigo-300 hover:bg-indigo-300 hover:text-neutral-900":
            variant === "outlined",
        }
      )}
      {...props}
    />
  );
};

export default Chip;
