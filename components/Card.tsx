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
        "flex cursor-pointer flex-col rounded-xl border border-pink-500 bg-gradient-to-r from-pink-500 via-rose-400 to-orange-300 p-0.5 hover:border-pink-500 hover:from-orange-300 hover:via-rose-400 hover:to-pink-500",
        className
      )}
      onClick={onClick}
    >
      <div className="w-full grow rounded-xl bg-gray-900 p-4">{children}</div>
    </div>
  );
};

export default Card;
