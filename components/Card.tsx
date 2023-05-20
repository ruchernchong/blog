import { MouseEventHandler, PropsWithChildren } from "react";
import classNames from "classnames";

interface CardProps extends PropsWithChildren {
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const Card = ({ children, className, onClick }: CardProps) => {
  return (
    <div
      className={classNames(
        "flex cursor-pointer flex-col rounded-xl border bg-gradient-to-r from-indigo-300 to-red-300 p-0.5 hover:border-indigo-300 hover:from-red-300 hover:to-indigo-300",
        className
      )}
      onClick={onClick}
    >
      <div className="w-full grow rounded-xl bg-neutral-900 p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;
