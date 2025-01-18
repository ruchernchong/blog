import type {
  HTMLAttributes,
  MouseEventHandler,
  PropsWithChildren,
} from "react";
import classNames from "classnames";

interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const Card = ({ children, className, onClick, ...props }: CardProps) => {
  return (
    <div
      className={classNames(
        "flex cursor-pointer flex-col rounded-xl border border-pink-500 bg-gradient-to-r from-pink-500 to-yellow-400 p-0.5 hover:border-pink-500 hover:from-yellow-400 hover:via-rose-400 hover:to-pink-500",
        className,
      )}
      onClick={onClick}
      data-umami-event="card-interaction"
      {...props}
    >
      <div className="w-full grow rounded-xl bg-zinc-900 p-4">{children}</div>
    </div>
  );
};

export default Card;
