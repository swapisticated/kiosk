"use client";

import { BentoCard } from "@/components/ui/BentoCard";
import { cn } from "@/lib/utils";

export function ChartBento({ className }: { className?: string }) {
  // Mock data for the chart
  const data = [35, 60, 45, 70, 50, 40, 55];

  return (
    <BentoCard className={cn("flex flex-col", className)} colSpan={1}>
      <div className="mb-6">
        <h3 className="text-xl font-bold">Activity</h3>
        <p className="text-sm text-muted-foreground">This week</p>
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 h-[120px] pb-2">
        {data.map((value, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 group w-full"
          >
            <div
              className="w-full bg-muted group-hover:bg-primary/20 rounded-full transition-all relative overflow-hidden"
              style={{ height: `${value}%` }}
            >
              {/* Active bar indicator for Wednesday (index 3) */}
              {i === 3 && (
                <div className="absolute inset-x-0 top-0 bottom-0 bg-primary opacity-20" />
              )}
              {i === 3 && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {["M", "T", "W", "T", "F", "S", "S"][i]}
            </span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
