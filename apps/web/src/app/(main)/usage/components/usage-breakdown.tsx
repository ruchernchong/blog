"use client";

import { Segment, Widget } from "@heroui-pro/react";
import type { UsageBreakdownRow } from "@workspace/usage/types";
import { useState } from "react";
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
    <Widget>
      <Widget.Header>
        <Widget.Title>{title}</Widget.Title>
        <Widget.Description>{active.description}</Widget.Description>
      </Widget.Header>
      <Widget.Content>
        <div className="flex flex-col gap-4">
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
          <BreakdownChartClient rows={active.rows} />
        </div>
      </Widget.Content>
    </Widget>
  );
}
