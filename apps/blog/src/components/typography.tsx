import { type VariantProps, cva } from "class-variance-authority";
import { createElement, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "text-4xl font-bold tracking-tight text-foreground sm:text-5xl",
      h2: "text-3xl font-semibold tracking-tight text-foreground",
      h3: "text-xl font-semibold text-foreground",
      h4: "text-lg font-semibold text-foreground",
      h5: "text-base font-semibold text-foreground",
      h6: "text-sm font-semibold text-foreground",
      "body-lg": "text-lg leading-relaxed text-foreground",
      body: "text-base text-foreground",
      "body-sm": "text-sm text-foreground",
      caption: "text-sm text-muted-foreground",
      label: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

type VariantKey = NonNullable<VariantProps<typeof typographyVariants>["variant"]>;

const variantElementMap: Record<VariantKey, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "body-lg": "p",
  body: "p",
  "body-sm": "p",
  caption: "span",
  label: "span",
};

export interface TypographyProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: ElementType;
}

export const Typography = ({
  variant = "body",
  as,
  className,
  children,
  ...props
}: TypographyProps) => {
  const element = as ?? variantElementMap[variant ?? "body"];

  return createElement(
    element,
    {
      className: cn(typographyVariants({ variant }), className),
      ...props,
    },
    children,
  );
};

export { typographyVariants };
