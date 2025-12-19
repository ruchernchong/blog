"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -2,
        boxShadow: "0 8px 30px -10px oklch(0.60 0.18 25 / 0.4)",
      }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4 rounded-2xl bg-muted/50 p-6"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-bold text-4xl">{value.toLocaleString()}</span>
    </motion.div>
  );
}
