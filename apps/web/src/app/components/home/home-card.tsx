import type { ReactNode } from "react";
import { SurfaceCard } from "@/app/components/surface-card";

export function HomeCard({ children }: { children: ReactNode }) {
  return <SurfaceCard className="flex flex-col gap-14">{children}</SurfaceCard>;
}
