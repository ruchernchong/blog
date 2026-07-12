import type { ReactNode } from "react";

export function HomeCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-14 rounded-3xl bg-surface px-6 py-10 shadow-(--surface-shadow) sm:px-14">
      {children}
    </div>
  );
}
