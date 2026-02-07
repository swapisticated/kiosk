"use client";

import { cn } from "@/lib/utils";

interface RightPanelProps {
  children?: React.ReactNode;
  className?: string;
}

export function RightPanel({ children, className }: RightPanelProps) {
  return (
    <aside
      className={cn(
        "flex flex-col w-[280px] h-full py-6 px-4 bg-transparent",
        "border-l border-white/[0.06]",
        className
      )}
    >
      {children}
    </aside>
  );
}
