"use client";

import { Drawer } from "@heroui/react";
import {
  formatCost,
  formatNumber,
  formatTokens,
} from "@workspace/usage/format";
import { deriveModelCharacter } from "@workspace/usage/model-character";
import { agentLabel } from "@workspace/usage/narrative";
import type { UsageBreakdownRow } from "@workspace/usage/types";
import { format, parseISO } from "date-fns";
import { useQueryState } from "nuqs";
import { usageParsers } from "../searchParams";

interface UsageModelDrawerProps {
  byModel: UsageBreakdownRow[];
  modelDisplayNames: Record<string, string>;
  providerDisplayNames: Record<string, string>;
}

const percent = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 0,
  style: "percent",
});

const formatDate = (date: string) => format(parseISO(date), "d MMM yyyy");

function orDash<T>(value: T | null, formatValue: (value: T) => string) {
  return value === null ? "–" : formatValue(value);
}

/** Daily tokens over the trailing window as a thin one-hue line. */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 0);
  if (values.length < 2 || max === 0) {
    return null;
  }
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 30 - (value / max) * 28;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 32"
    >
      <polyline
        fill="none"
        points={points}
        stroke="var(--chart-3)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="font-medium text-muted text-xs uppercase tracking-wider">
        {label}
      </dt>
      <dd className="font-semibold text-foreground text-lg tabular-nums">
        {value}
      </dd>
    </div>
  );
}

/**
 * Per-model profile, opened from the Explorer and driven by `?model=` so a
 * profile can be linked directly. An unknown id simply leaves it closed.
 */
export function UsageModelDrawer({
  byModel,
  modelDisplayNames,
  providerDisplayNames,
}: UsageModelDrawerProps) {
  const [model, setModel] = useQueryState(
    "model",
    usageParsers.model.withOptions({ history: "replace" }),
  );
  const row = model ? byModel.find((entry) => entry.key === model) : undefined;

  return (
    <Drawer>
      <Drawer.Backdrop
        isOpen={row !== undefined}
        onOpenChange={(isOpen) => {
          if (!isOpen) void setModel(null);
        }}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-full max-w-md">
            {row ? (
              <ModelProfile
                modelDisplayNames={modelDisplayNames}
                providerDisplayNames={providerDisplayNames}
                row={row}
              />
            ) : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

function ModelProfile({
  row,
  modelDisplayNames,
  providerDisplayNames,
}: {
  row: UsageBreakdownRow;
  modelDisplayNames: Record<string, string>;
  providerDisplayNames: Record<string, string>;
}) {
  const character = deriveModelCharacter(row);
  const providers = row.providers
    .map((provider) => providerDisplayNames[provider] ?? provider)
    .join(", ");

  return (
    <>
      <Drawer.CloseTrigger />
      <Drawer.Header className="flex flex-col gap-2">
        <Drawer.Heading>{modelDisplayNames[row.key] ?? row.key}</Drawer.Heading>
        <p className="font-mono text-muted text-xs">{row.key}</p>
      </Drawer.Header>
      <Drawer.Body className="flex flex-col gap-8">
        <p className="text-muted text-sm">
          Used {formatDate(row.firstUsed)} – {formatDate(row.lastUsed)} via{" "}
          {row.agents.map(agentLabel).join(", ")}
          {providers ? ` on ${providers}` : ""}.
        </p>

        <dl className="grid grid-cols-2 gap-6">
          <Fact label="Tokens" value={formatTokens(row.tokens)} />
          <Fact label="API equivalent" value={formatCost(row.cost)} />
          <Fact label="Active days" value={formatNumber(row.activeDays)} />
          <Fact label="Messages" value={formatNumber(row.messages)} />
          <Fact
            label="$ / 1M tokens"
            value={formatCost(row.costPerMillionTokens)}
          />
          <Fact
            label="Cache hit"
            value={orDash(character.cacheHitRate, percent.format)}
          />
        </dl>

        {row.sparkline.some((value) => value > 0) ? (
          <section className="flex flex-col gap-2" aria-label="Recent activity">
            <h3 className="font-semibold text-base text-foreground">
              Last 90 days
            </h3>
            <Sparkline values={row.sparkline} />
          </section>
        ) : null}
      </Drawer.Body>
    </>
  );
}
