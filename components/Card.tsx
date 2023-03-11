import { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {}

const Card = ({ children }: CardProps) => {
  return (
    <div className="flex flex-col rounded-2xl border p-4 md:border-neutral-600 hover:md:border-neutral-400">
      {children}
    </div>
  );
};

export default Card;
