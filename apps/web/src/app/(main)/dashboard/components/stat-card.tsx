import { KPI } from "@heroui-pro/react";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <KPI className="transition-all duration-200 hover:-translate-y-0.5">
      <KPI.Header>
        <KPI.Icon status="success">{icon}</KPI.Icon>
        <KPI.Title>{label}</KPI.Title>
      </KPI.Header>
      <KPI.Content>
        <KPI.Value className="text-4xl" locale="en-SG" value={value} />
      </KPI.Content>
    </KPI>
  );
}
