import { cn } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { getPreviewImage } from "@/lib/preview-image";

type FanCardProps = {
  label: string;
  title?: string;
  image?: string | null;
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

function FanCard({ label, title, image, className }: Readonly<FanCardProps>) {
  return (
    <Link
      href="/projects"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-(--overlay-shadow)",
        className,
        image && "h-auto",
      )}
    >
      <TrafficLights />
      {image ? (
        <div className="relative aspect-[1200/630] bg-default/50">
          <Image
            src={image}
            alt={`${title ?? label} preview`}
            fill
            sizes="(min-width: 768px) 280px, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex grow flex-col items-center justify-center gap-1.5 bg-default/50">
          {title && (
            <span className="font-semibold text-sm tracking-tight">
              {title}
            </span>
          )}
          <span className="font-mono text-muted text-xs">{label}</span>
        </div>
      )}
    </Link>
  );
}

export async function ProjectFan() {
  const [isLeapYearImage, motorMetricsImage, claudeKitImage] =
    await Promise.all([
      getPreviewImage("https://isleapyear.app"),
      getPreviewImage("https://motormetrics.app"),
      getPreviewImage("https://github.com/ruchernchong/claude-kit"),
    ]);

  return (
    <section className="flex flex-col items-center justify-center gap-5 md:-mx-8 md:flex-row lg:-mx-30">
      <FanCard
        label="isleapyear.app"
        image={isLeapYearImage}
        className="h-[150px] w-full md:w-44 md:-rotate-4 md:opacity-85 lg:w-50"
      />
      <FanCard
        title="MotorMetrics"
        label="motormetrics.app"
        image={motorMetricsImage}
        className="z-2 h-50 w-full transition-transform hover:-translate-y-1 md:w-60 lg:w-70"
      />
      <FanCard
        label="claude-kit"
        image={claudeKitImage}
        className="h-[150px] w-full md:w-44 md:rotate-4 md:opacity-85 lg:w-50"
      />
    </section>
  );
}
