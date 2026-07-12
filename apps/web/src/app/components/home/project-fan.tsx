import { cn } from "@heroui/react";
import Link from "next/link";

type FanCardProps = {
  label: string;
  title?: string;
  className?: string;
};

function TrafficLights() {
  return (
    <div className="flex items-center gap-1 border-separator border-b px-3 py-2">
      <span className="size-1.5 rounded-full bg-[#ff5f57]" />
      <span className="size-1.5 rounded-full bg-[#febc2e]" />
      <span className="size-1.5 rounded-full bg-[#28c840]" />
    </div>
  );
}

function FanCard({ label, title, className }: FanCardProps) {
  return (
    <Link
      href="/projects"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-(--overlay-shadow)",
        className,
      )}
    >
      <TrafficLights />
      <div className="flex grow flex-col items-center justify-center gap-1.5 bg-default/50">
        {title && (
          <span className="font-semibold text-sm tracking-tight">{title}</span>
        )}
        <span className="font-mono text-muted text-xs">{label}</span>
      </div>
    </Link>
  );
}

export function ProjectFan() {
  return (
    <section className="flex flex-col items-center justify-center gap-5 md:-mx-30 md:flex-row">
      <FanCard
        label="isleapyear.app"
        className="h-[150px] w-full md:w-50 md:-rotate-4 md:opacity-85"
      />
      <FanCard
        title="SG Cars Trends"
        label="sgcarstrends.com"
        className="z-2 h-50 w-full transition-transform hover:-translate-y-1 md:w-70"
      />
      <FanCard
        label="claude-kit"
        className="h-[150px] w-full md:w-50 md:rotate-4 md:opacity-85"
      />
    </section>
  );
}
