import { formatCurrencyCompact } from "@workspace/usage/format";
import type { CacheTrendPoint, TokenBreakdown } from "@workspace/usage/types";
import { format, parseISO } from "date-fns";

interface UsageCacheSummaryProps {
  tokenMix: TokenBreakdown;
  cacheTrend: CacheTrendPoint[];
}

const percent = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 0,
  style: "percent",
});

function weekLabel(point: CacheTrendPoint): string {
  const week = format(parseISO(point.week), "d MMM yyyy");
  return point.hitRate === null
    ? `Week of ${week}: idle`
    : `Week of ${week}: ${percent.format(point.hitRate)} cache hit`;
}

/**
 * Weekly cache-hit rate as plain columns: one hue, since it is a magnitude.
 * Each column carries its own label for hover and assistive tech.
 */
function CacheHitColumns({ points }: { points: CacheTrendPoint[] }) {
  return (
    <ul
      aria-label="Weekly cache-hit rate"
      className="flex h-32 items-end gap-0.5"
    >
      {points.map((point) => (
        <li
          aria-label={weekLabel(point)}
          className="flex h-full min-w-0 flex-1 items-end"
          key={point.week}
          title={weekLabel(point)}
        >
          <span
            className="w-full rounded-t-sm bg-[var(--chart-3)]"
            style={{ height: `${Math.round((point.hitRate ?? 0) * 100)}%` }}
          />
        </li>
      ))}
    </ul>
  );
}

/** All-time cache-hit rate and savings over the weekly hit-rate columns. */
export function UsageCacheSummary({
  tokenMix,
  cacheTrend,
}: UsageCacheSummaryProps) {
  const prompt = tokenMix.input + tokenMix.cacheRead + tokenMix.cacheWrite;
  const hitRate = prompt > 0 ? tokenMix.cacheRead / prompt : null;
  const priced = cacheTrend.filter((point) => point.savings !== null);
  const savings =
    priced.length > 0
      ? priced.reduce((sum, point) => sum + (point.savings ?? 0), 0)
      : null;
  const first = cacheTrend[0];
  const last = cacheTrend[cacheTrend.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-6">
        <div className="flex flex-col-reverse gap-2">
          <dt className="font-medium text-muted text-xs uppercase tracking-wider">
            Cache hit rate
          </dt>
          <dd className="font-bold text-4xl tabular-nums tracking-tighter">
            {hitRate === null ? "–" : percent.format(hitRate)}
          </dd>
        </div>
        <div className="flex flex-col-reverse gap-2">
          <dt className="font-medium text-muted text-xs uppercase tracking-wider">
            Saved by caching
          </dt>
          <dd className="font-bold text-4xl tabular-nums tracking-tighter">
            {savings === null ? "N.A." : formatCurrencyCompact(savings)}
          </dd>
        </div>
      </dl>
      {first && last ? (
        <div className="flex flex-col gap-2">
          <CacheHitColumns points={cacheTrend} />
          <div className="flex justify-between font-mono text-muted text-xs">
            <span>{format(parseISO(first.week), "MMM yyyy")}</span>
            <span>{format(parseISO(last.week), "MMM yyyy")}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
