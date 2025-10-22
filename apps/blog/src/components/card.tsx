import type { PropsWithChildren, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  className?: string;
}

interface CardTitleProps extends PropsWithChildren {
  className?: string;
}

interface CardHeaderProps extends PropsWithChildren {
  className?: string;
}

interface CardContentProps extends PropsWithChildren {
  className?: string;
}

interface CardDescriptionProps extends PropsWithChildren {
  className?: string;
}

interface CardFooterProps extends PropsWithChildren {
  className?: string;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 bg-transparent shadow-lg backdrop-blur-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className }: CardTitleProps) => {
  return (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h3>
  );
};

export const CardHeader = ({ children, className }: CardHeaderProps) => {
  return (
    <div className={cn("flex flex-col gap-2 p-6", className)}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className }: CardContentProps) => {
  return (
    <div className={cn("p-6 pt-0", className)}>
      {children}
    </div>
  );
};

export const CardDescription = ({ children, className }: CardDescriptionProps) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
};

export const CardFooter = ({ children, className }: CardFooterProps) => {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)}>
      {children}
    </div>
  );
};
