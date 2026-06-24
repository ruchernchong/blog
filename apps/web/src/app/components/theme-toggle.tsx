"use client";

import { Segment } from "@heroui-pro/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const MODES = [
  { id: "light", label: "Light", icon: Sun03Icon },
  { id: "dark", label: "Dark", icon: Moon02Icon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Until mounted, render the default ("light") so server and first client
  // render match (next-themes reads localStorage on the client, which would
  // otherwise differ).
  const selected = mounted && theme === "dark" ? "dark" : "light";

  return (
    <Segment
      aria-label="Theme"
      size="sm"
      variant="ghost"
      selectedKey={selected}
      onSelectionChange={(key) => setTheme(String(key))}
    >
      {MODES.map((mode) => (
        <Segment.Item key={mode.id} id={mode.id} aria-label={mode.label}>
          <HugeiconsIcon icon={mode.icon} size={16} />
          {mode.label}
        </Segment.Item>
      ))}
    </Segment>
  );
}
