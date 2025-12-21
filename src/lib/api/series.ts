import { getSeriesById } from "@/lib/queries/series";
import type { SelectSeries } from "@/schema";
import { seriesIdSchema } from "@/types/api";
import { notFoundResponse } from "./errors";
import { validateRouteParam } from "./params";
import type { ApiResult } from "./types";

type SeriesWithId = { seriesId: string; series: SelectSeries };

/**
 * Validates series ID param and checks series exists.
 * Combines param validation with existence check to reduce boilerplate.
 *
 * @example
 * ```typescript
 * const result = await validateSeriesExists(params);
 * if (!result.success) return result.response;
 * const { seriesId, series } = result.data;
 * ```
 */
export async function validateSeriesExists(
  params: Promise<{ id: string }>,
): Promise<ApiResult<SeriesWithId>> {
  const paramResult = await validateRouteParam(
    params,
    "id",
    seriesIdSchema,
    "series",
  );
  if (!paramResult.success) return paramResult;

  const series = await getSeriesById(paramResult.data);

  if (!series) {
    return { success: false, response: notFoundResponse("Series") };
  }

  return { success: true, data: { seriesId: paramResult.data, series } };
}
