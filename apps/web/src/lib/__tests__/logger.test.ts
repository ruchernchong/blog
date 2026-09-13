import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ERROR_IDS } from "@/constants/error-ids";
import { logDebug, logError, logEvent, logInfo, logWarning } from "../logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("should log an Error with its message and stack", () => {
    const error = new Error("boom");

    logError(ERROR_IDS.INVALID_JSON, error, { slug: "post" });

    expect(console.error).toHaveBeenCalledWith(
      `[${ERROR_IDS.INVALID_JSON}]`,
      expect.objectContaining({
        message: "boom",
        stack: error.stack,
        context: { slug: "post" },
      }),
    );
  });

  it("should log a non-Error value as a string", () => {
    logError(ERROR_IDS.INVALID_JSON, "plain failure");

    expect(console.error).toHaveBeenCalledWith(
      `[${ERROR_IDS.INVALID_JSON}]`,
      expect.objectContaining({ message: "plain failure", stack: undefined }),
    );
  });

  it("should log warnings", () => {
    logWarning("careful");

    expect(console.warn).toHaveBeenCalledWith(
      "[WARNING]",
      expect.objectContaining({ message: "careful" }),
    );
  });

  it("should log info, debug and events in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    logInfo("info");
    logDebug("debug");
    logEvent("post_created", { id: "1" });

    expect(console.info).toHaveBeenCalled();
    expect(console.debug).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith("[EVENT: post_created]", {
      id: "1",
    });
  });

  it("should not log info, debug or events outside development", () => {
    vi.stubEnv("NODE_ENV", "production");

    logInfo("info");
    logDebug("debug");
    logEvent("post_created");

    expect(console.info).not.toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
});
