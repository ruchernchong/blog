import { PropsWithChildren } from "react";

interface TagProps extends PropsWithChildren {}

export const Chip = ({ ...props }: TagProps) => {
  return (
    <button
      type="button"
      className="rounded-full text-center text-sm font-medium uppercase text-indigo-300 hover:text-indigo-100"
      {...props}
    />
  );
};
