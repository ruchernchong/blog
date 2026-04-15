"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

interface UseAutoSaveOptions {
  saveFn: () => Promise<void>;
  data: unknown;
  debounceMs?: number;
  enabled?: boolean;
  onSaveError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  retryCount: number;
  triggerSave: () => Promise<void>;
}

const MAX_BACKOFF_MS = 30_000;

function getBackoffDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
}

function serialise(data: unknown): string {
  try {
    return JSON.stringify(data) ?? "";
  } catch {
    return String(data);
  }
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  return `${Math.floor(diffMinutes / 60)}h ago`;
}

export { formatRelativeTime };

export function useAutoSave({
  saveFn,
  data,
  debounceMs = 1500,
  enabled = true,
  onSaveError,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [changeVersion, setChangeVersion] = useState(0);

  const prevSignatureRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);
  const onErrorRef = useRef(onSaveError);
  const isSavingRef = useRef(false);
  const retryCountRef = useRef(0);
  const enabledRef = useRef(enabled);

  saveFnRef.current = saveFn;
  onErrorRef.current = onSaveError;
  enabledRef.current = enabled;

  const currentSignature = serialise(data);
  if (currentSignature !== prevSignatureRef.current) {
    prevSignatureRef.current = currentSignature;
    setChangeVersion((v) => v + 1);
  }

  const clearTimer = useCallback(
    (ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    },
    [],
  );

  const flushPendingTimers = useCallback(() => {
    clearTimer(timerRef);
    clearTimer(retryTimerRef);
  }, [clearTimer]);

  const executeSave = useCallback(async () => {
    if (isSavingRef.current || !enabledRef.current) return;

    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      await saveFnRef.current();
      retryCountRef.current = 0;
      setRetryCount(0);
      setSaveStatus("saved");
      setLastSavedAt(new Date());
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("Auto-save failed");
      onErrorRef.current?.(err);

      retryCountRef.current += 1;
      setRetryCount(retryCountRef.current);
      setSaveStatus("error");

      const delay = getBackoffDelay(retryCountRef.current - 1);
      retryTimerRef.current = setTimeout(() => {
        if (enabledRef.current && !isSavingRef.current) {
          executeSave();
        }
      }, delay);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const triggerSave = useCallback(async () => {
    flushPendingTimers();
    await executeSave();
  }, [executeSave, flushPendingTimers]);

  useEffect(() => {
    if (!enabled || isSavingRef.current || changeVersion === 0) return;

    clearTimer(timerRef);

    timerRef.current = setTimeout(() => {
      executeSave();
    }, debounceMs);

    return () => {
      clearTimer(timerRef);
    };
  }, [changeVersion, enabled, debounceMs, executeSave, clearTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && enabledRef.current) {
        flushPendingTimers();
        if (isSavingRef.current) return;

        const saveData = async () => {
          try {
            await saveFnRef.current();
            retryCountRef.current = 0;
            setRetryCount(0);
          } catch {
            // Silent fail on visibility change — will retry on next focus
          }
        };
        saveData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushPendingTimers]);

  useEffect(() => {
    const handleOnline = () => {
      if (saveStatus === "offline" || saveStatus === "error") {
        retryCountRef.current = 0;
        setRetryCount(0);
        setSaveStatus("idle");
        executeSave();
      }
    };

    const handleOffline = () => {
      setSaveStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [saveStatus, executeSave]);

  useEffect(() => {
    return flushPendingTimers;
  }, [flushPendingTimers]);

  return { saveStatus, lastSavedAt, retryCount, triggerSave };
}

export function useBeforeUnload(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [enabled]);
}
