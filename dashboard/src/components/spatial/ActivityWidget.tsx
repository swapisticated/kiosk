"use client";

import { cn } from "@/lib/utils";
import { FileText, AlertCircle } from "lucide-react";

import { LoaderCore } from "@/components/ui/multi-step-loader";

interface ActivityItem {
  id: string;
  name: string;
  status: "uploading" | "complete" | "error";
  progress?: number;
  size?: string;
}

interface ActivityWidgetProps {
  items?: ActivityItem[];
  className?: string;
}

const DEFAULT_ITEMS: ActivityItem[] = [
  { id: "1", name: "Agent Brief.pdf", status: "complete", size: "1.1 GB" },
  { id: "2", name: "Pipeline Invoice", status: "error" },
];

export function ActivityWidget({
  items = DEFAULT_ITEMS,
  className,
}: ActivityWidgetProps) {
  // Calculate current active step for the loader
  // Finds the index of the first item that is NOT complete.
  // If all complete, header to end.
  const activeIndex = items.findIndex(
    (item) => item.status === "uploading" || item.status === "error"
  );
  const value =
    activeIndex === -1 && items.length > 0
      ? items.length
      : activeIndex === -1
      ? 0
      : activeIndex;

  const loadingStates = items.map((item) => ({
    text:
      item.status === "uploading"
        ? `${item.name} (${Math.round(item.progress || 0)}%)`
        : item.name,
  }));

  return (
    <div
      className={cn(
        "absolute bottom-6 right-6 z-50",
        "w-[260px] p-4",
        "rounded-2xl",
        className
      )}
    >
      {/* Header */}
      <h4 className="text-sm font-semibold text-white mb-4">Uploads</h4>

      {/* Activity List via MultiStepLoader Core */}
      <div className="flex flex-col gap-3 min-h-[100px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-white/20 gap-2">
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
            <span className="text-sm font-medium tracking-wide">
              SYSTEM IDLE
            </span>
          </div>
        ) : (
          <div className="scale-90 origin-top-left -ml-2 w-[110%]">
            <LoaderCore loadingStates={loadingStates} value={value} />
          </div>
        )}
      </div>
    </div>
  );
}
