import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import type { ApiResult } from "./types";

/**
 * Validates a route parameter against a Zod schema.
 *
 * @param params - Promise of route params (Next.js 15+ dynamic route params)
 * @param paramName - Name of the parameter to extract (e.g., "id")
 * @param schema - Zod schema to validate the parameter
 * @param resourceType - Resource type for error message (e.g., "media", "post")
 * @returns Result with validated parameter on success, or 400 response on failure
 *
 * @example
 * ```typescript
 * const result = await validateRouteParam(params, "id", mediaIdSchema, "media");
 * if (!result.success) return result.response;
 * const mediaId = result.data;
 * ```
 */
export async function validateRouteParam<T>(
  params: Promise<Record<string, string>>,
  paramName: string,
  schema: ZodSchema<T>,
  resourceType: string,
): Promise<ApiResult<T>> {
  try {
    const resolvedParams = await params;
    const validated = schema.parse(resolvedParams[paramName]);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          { message: `Invalid ${resourceType} ID format` },
          { status: 400 },
        ),
      };
    }
    logError(ERROR_IDS.INVALID_PARAMS, error);
    return {
      success: false,
      response: NextResponse.json(
        { message: "Invalid request parameters" },
        { status: 400 },
      ),
    };
  }
}
