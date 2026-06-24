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

  const current = (theme ?? "system") as (typeof ORDER)[number];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <Tooltip delay={0}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`Theme: ${current}. Switch to ${next} theme.`}
        onPress={() => setTheme(next)}
      >
        <HugeiconsIcon icon={ICONS[mounted ? current : "system"]} size={18} />
      </Button>
      <Tooltip.Content>Theme: {current}</Tooltip.Content>
    </Tooltip>
  );
}
