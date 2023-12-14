import { createElement, PropsWithChildren } from "react";

interface TypographyProps extends PropsWithChildren {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  className?: string;
}

export const Typography = ({
  variant,
  className,
  children,
  ...props
}: TypographyProps) => {
  let headingClassName: string = "";

  switch (variant) {
    case "h1":
      headingClassName =
        "inline-block bg-gradient-to-r from-pink-500 via-rose-400 to-orange-300 bg-clip-text text-4xl font-extrabold uppercase text-transparent md:text-5xl";
      break;
    case "h2":
      headingClassName = "text-2xl font-bold";
      break;
    case "h3":
      headingClassName = "text-xl font-medium";
      break;
    default:
      break;
  }

  const combinedClassName = [headingClassName, className].join(" ");

  return createElement(
    variant || "p",
    { className: combinedClassName, ...props },
    children
  );
};
