import { PropsWithChildren } from "react";

interface TagProps extends PropsWithChildren {}

export const Chip = ({ ...props }: TagProps) => {
  return (
    <button
      type="button"
      className="z-20 rounded-full text-center text-sm font-medium uppercase text-pink-500 hover:text-pink-300"
      {...props}
    />
  );
};
