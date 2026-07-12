"use client";

import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
    >
      {mounted && (
        <HugeiconsIcon
          icon={resolvedTheme === "dark" ? Sun01Icon : Moon02Icon}
          size={16}
          strokeWidth={2}
        />
      )}
    </button>
  );
}
