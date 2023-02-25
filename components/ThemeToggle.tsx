import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  useEffect(() => setIsMounted(true), []);

  return (
    <button
      type="button"
      aria-label="Toggle Theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 ring-2 ring-neutral-600 hover:ring-2 dark:bg-neutral-900"
      onClick={() => setTheme(isDarkMode ? "light" : "dark")}
    >
      {isMounted && (
        <div className="h-6 w-6">{isDarkMode ? <SunIcon /> : <MoonIcon />}</div>
      )}
    </button>
  );
}
