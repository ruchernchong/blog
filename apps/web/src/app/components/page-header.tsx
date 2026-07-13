interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {eyebrow && (
        <span className="font-mono font-semibold text-accent text-xs uppercase tracking-widest">
          {eyebrow}
        </span>
      )}
      <h1 className="font-bold text-3xl tracking-tighter sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-xl text-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
}
