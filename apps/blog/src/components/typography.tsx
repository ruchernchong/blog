import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "font-bold text-4xl text-foreground tracking-tight sm:text-5xl",
      h2: "font-semibold text-3xl text-foreground tracking-tight",
      h3: "font-semibold text-foreground text-xl",
      h4: "font-semibold text-foreground text-lg",
      h5: "font-semibold text-base text-foreground",
      h6: "font-semibold text-foreground text-sm",
      "body-lg": "text-foreground text-lg leading-relaxed",
      body: "text-base text-foreground",
      "body-sm": "text-foreground text-sm",
      caption: "text-muted-foreground text-sm",
      label:
        "font-medium text-muted-foreground text-xs uppercase tracking-wider",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

type VariantKey = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>;

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
