"use client";

import { Chip } from "@heroui/react";
import { Timeline } from "@heroui-pro/react";
import { Briefcase01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Company } from "@/types";

interface TimelineThreadProps {
  companies: Company[];
}

const MilestoneBody = ({
  company,
  order = "chip-first",
}: {
  company: Company;
  order?: "chip-first" | "name-first";
}) => {
  const { name, title, dateEnd, location, url, roles } = company;
  const isCurrentRole = !dateEnd;
  const hasRoles = roles && roles.length > 0;

  const chip = (
    <Chip color={isCurrentRole ? "accent" : "default"} size="sm">
      {isCurrentRole ? "Present" : dateEnd}
    </Chip>
  );
  const heading = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="font-semibold tracking-tight hover:text-accent"
    >
      {name}
    </a>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {order === "chip-first" ? (
          <>
            {chip}
            {heading}
          </>
        ) : (
          <>
            {heading}
            {chip}
          </>
        )}
      </div>

      {hasRoles ? (
        <div className="flex flex-col gap-2">
          {roles.map((role) => (
            <div
              key={`${role.title}-${role.dateStart}`}
              className="flex flex-col gap-1"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{role.title}</span>
                {role.team && (
                  <Chip size="sm" variant="soft">
                    {role.team}
                  </Chip>
                )}
              </div>
              <span className="text-muted text-sm">
                {role.dateStart} — {role.dateEnd ?? "Present"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-muted">{title}</span>
      )}

      <span className="text-muted text-sm">{location}</span>
    </>
  );
};

export const TimelineThread = ({ companies }: TimelineThreadProps) => {
  return (
    <>
      {/* Mobile: start-axis fallback */}
      <div className="sm:hidden">
        <Timeline density="compact" size="sm">
          {companies.map((company) => (
            <Timeline.Item
              key={company.name}
              status={!company.dateEnd ? "current" : "default"}
            >
              <Timeline.Marker aria-hidden="true">
                <HugeiconsIcon icon={Briefcase01Icon} />
              </Timeline.Marker>
              <Timeline.Content className="gap-1.5">
                <MilestoneBody company={company} order="name-first" />
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>

      {/* Desktop: centered axis, alternating sides */}
      <div className="hidden sm:block">
        <Timeline
          axis="center"
          itemAlign="start"
          placement="alternate"
          size="md"
        >
          {companies.map((company, index) => {
            const isStartSide = index % 2 === 1;

            return (
              <Timeline.Item
                key={company.name}
                status={!company.dateEnd ? "current" : "default"}
              >
                <Timeline.Marker aria-hidden="true">
                  <HugeiconsIcon icon={Briefcase01Icon} />
                </Timeline.Marker>
                <Timeline.Content className="max-w-[260px] gap-1.5">
                  <MilestoneBody
                    company={company}
                    order={isStartSide ? "chip-first" : "name-first"}
                  />
                </Timeline.Content>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </div>
    </>
  );
};
