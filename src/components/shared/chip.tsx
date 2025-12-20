import type { PropsWithChildren } from "react";

interface TagProps extends PropsWithChildren {}

export const Chip = ({ ...props }: TagProps) => {
  return (
    <button
      type="button"
      className="z-20 rounded-full text-center font-medium text-primary text-sm uppercase hover:text-muted-foreground"
      {...props}
    />
  );
};
