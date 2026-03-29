import { Briefcase01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Company } from "@/types";

interface TimelineThreadProps {
  companies: Company[];
}

export const TimelineThread = ({ companies }: TimelineThreadProps) => {
  return (
    <div className="relative">
      {/* Dotted thread line */}
      <div
        className="absolute top-4 bottom-4 left-[18px] w-px md:left-[22px]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, oklch(0.60 0.18 25) 0%, oklch(0.60 0.18 25 / 0.3) 60%, transparent 100%)",
          maskImage:
            "repeating-linear-gradient(to bottom, black 0px, black 4px, transparent 4px, transparent 10px)",
          WebkitMaskImage:
            "repeating-linear-gradient(to bottom, black 0px, black 4px, transparent 4px, transparent 10px)",
        }}
      />

      <div className="flex flex-col gap-6">
        {companies.map(
          ({ name, title, logo, dateStart, dateEnd, location, url, roles }) => {
            const isCurrentRole = !dateEnd;
            const startYear = dateStart.split(" ")[1];
            const hasRoles = roles && roles.length > 0;

            // Calculate total duration text for companies with roles
            const durationText = hasRoles
              ? `${dateStart} — Present`
              : `${dateStart} — ${dateEnd ?? "Present"}`;

            return (
              <div key={name} className="group relative flex gap-4 md:gap-6">
                {/* Node column */}
                <div className="relative z-10 flex flex-col items-center">
                  {/* Node dot */}
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full border-2 bg-card transition-all duration-200",
                      isCurrentRole
                        ? "size-11 border-primary shadow-[0_0_16px_-4px_oklch(0.60_0.18_25_/_0.6)] md:size-12"
                        : "size-9 border-border group-hover:border-primary/50 md:size-10",
                    )}
                  >
                    {logo ? (
                      <Image
                        src={logo}
                        width={24}
                        height={24}
                        alt={`${name} logo`}
                        className={cn(
                          "object-contain",
                          isCurrentRole
                            ? "size-6 md:size-7"
                            : "size-5 md:size-6",
                        )}
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={Briefcase01Icon}
                        size={isCurrentRole ? 18 : 16}
                        className="text-muted-foreground"
                      />
                    )}
                  </div>

                  {/* Year label */}
                  <span
                    className={cn(
                      "mt-1 font-mono text-xs tabular-nums",
                      isCurrentRole
                        ? "font-semibold text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {startYear}
                  </span>

                  {/* Pulse for current */}
                  {isCurrentRole && (
                    <span className="absolute top-0 -right-0.5 flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                    </span>
                  )}
                </div>

                {/* Card */}
                <div className="flex-1">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block"
                  >
                    <Card
                      className={cn(
                        "py-4 transition-all duration-200 hover:-translate-y-0.5",
                        isCurrentRole
                          ? "ring-1 ring-primary/20 hover:shadow-[0_8px_30px_-10px_oklch(0.60_0.18_25_/_0.25)]"
                          : "hover:shadow-[0_8px_30px_-10px_oklch(0_0_0_/_0.08)]",
                      )}
                    >
                      <CardContent className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="font-semibold text-lg tracking-tight">
                              {name}
                            </span>
                            {!hasRoles && (
                              <span className="text-muted-foreground">
                                {title}
                              </span>
                            )}
                          </div>
                          <Badge
                            variant={isCurrentRole ? "default" : "outline"}
                            className="shrink-0"
                          >
                            {isCurrentRole ? "Present" : dateEnd}
                          </Badge>
                        </div>

                        {/* Nested roles */}
                        {hasRoles && (
                          <div className="relative flex flex-col gap-4 pl-4">
                            {/* Vertical line */}
                            <div className="absolute top-1 bottom-1 left-[3px] w-0.5 bg-border" />

                            {roles.map((role) => {
                              const isCurrentSubRole = !role.dateEnd;

                              return (
                                <div
                                  key={`${role.title}-${role.dateStart}`}
                                  className="relative flex flex-col gap-2"
                                >
                                  {/* Dot on line */}
                                  <span
                                    className={cn(
                                      "absolute -left-4 size-2 rounded-full",
                                      isCurrentSubRole
                                        ? "bg-primary"
                                        : "bg-muted-foreground",
                                    )}
                                  />

                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        "font-medium",
                                        isCurrentSubRole && "text-primary",
                                      )}
                                    >
                                      {role.title}
                                    </span>
                                    {role.team && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {role.team}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-muted-foreground text-sm">
                                    {role.dateStart} —{" "}
                                    {role.dateEnd ?? "Present"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          {!hasRoles && (
                            <>
                              <span>{durationText}</span>
                              <span className="text-border">•</span>
                            </>
                          )}
                          <span>{location}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};
