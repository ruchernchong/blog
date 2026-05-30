"use client";

import { Card } from "@heroui/react";
import { Segment } from "@heroui-pro/react";
import { useState } from "react";
import type { UsageBreakdownRow } from "@/lib/usage/types";
import { BreakdownChartClient } from "./breakdown-chart.client";

interface BreakdownView {
  id: string;
  label: string;
  description: string;
  rows: UsageBreakdownRow[];
}

interface UsageBreakdownProps {
  title: string;
  views: BreakdownView[];
}

/**
 * A single breakdown card whose dataset is toggled with a segmented control.
 * The chart stays a client leaf; this component owns the active-view state.
 */
export function UsageBreakdown({ title, views }: UsageBreakdownProps) {
  const [selectedKey, setSelectedKey] = useState<string>(views[0]?.id);
  const active = views.find((view) => view.id === selectedKey) ?? views[0];

  return (
    <Card>
      <Card.Header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Card.Title>{title}</Card.Title>
          <Card.Description>{active.description}</Card.Description>
        </div>
        <Segment
          selectedKey={selectedKey}
          onSelectionChange={(key) => setSelectedKey(String(key))}
          size="sm"
        >
          {views.map((view) => (
            <Segment.Item key={view.id} id={view.id}>
              <Segment.Separator />
              {view.label}
            </Segment.Item>
          ))}
        </Segment>
      </Card.Header>
      <Card.Content>
        <BreakdownChartClient rows={active.rows} />
      </Card.Content>
    </Card>
  );
}
