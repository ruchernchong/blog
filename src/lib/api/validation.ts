import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import type { ApiResult } from "./types";

/**
 * Parses JSON body from a request with error handling.
 *
 * @param request - The incoming request
 * @returns Result with parsed body on success, or 400 response on failure
 */
export async function parseJsonBody(
  request: Request,
): Promise<ApiResult<unknown>> {
  try {
    const body = await request.json();
    return { success: true, data: body };
  } catch (error) {
    logError(ERROR_IDS.INVALID_JSON, error);
    return {
      success: false,
      response: NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 },
      ),
    };
  }
}

/**
 * Validates data against a Zod schema.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result with validated data on success, or 400 response on failure
 */
export function validateSchema<T>(
  schema: ZodSchema<T>,
  data: unknown,
): ApiResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            message: "Validation failed",
            errors: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 },
        ),
      };
    }
    throw error;
  }
}

/**
 * Parses and validates JSON body in a single operation.
 * Combines parseJsonBody and validateSchema for convenience.
 *
 * @param request - The incoming request
 * @param schema - Zod schema to validate against
 * @returns Result with validated data on success, or error response on failure
 *
 * @example
 * ```typescript
 * const result = await parseAndValidateBody(request, confirmUploadSchema);
 * if (!result.success) return result.response;
 * const validatedData = result.data;
 * ```
 */
export async function parseAndValidateBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ApiResult<T>> {
  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) return parseResult;

  return validateSchema(schema, parseResult.data);
}
