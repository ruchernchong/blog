"use client";

import { Button, Tooltip } from "@heroui/react";
import {
  ComputerIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ORDER = ["system", "light", "dark"] as const;
const ICONS = { system: ComputerIcon, light: Sun03Icon, dark: Moon02Icon };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Until mounted, render a fixed state so server and first client render match
  // (next-themes reads localStorage on the client, which would otherwise differ).
  const current = (theme ?? "system") as (typeof ORDER)[number];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const icon = mounted ? ICONS[current] : ICONS.system;
  const label = mounted
    ? `Switch theme — currently ${current}`
    : "Toggle theme";

  return (
    <Tooltip delay={0}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={label}
        onPress={() => setTheme(next)}
      >
        <HugeiconsIcon icon={icon} size={18} />
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
