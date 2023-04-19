import { MouseEventHandler, PropsWithChildren } from "react";
import classNames from "classnames/dedupe";

interface CardProps extends PropsWithChildren {
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const Card = (props: CardProps) => {
  return (
    <div
      className={classNames(
        "flex flex-col rounded-2xl border p-4 md:border-neutral-600 hover:md:border-neutral-400",
        props.className
      )}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
};

export default Card;
