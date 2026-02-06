"use client";

import { cn } from "@/lib/utils";
import { FileText, AlertCircle } from "lucide-react";

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
  return (
    <div
      className={cn(
        "absolute bottom-6 right-6 z-50",
        "w-[260px] p-4",
        "glass rounded-2xl",
        className
      )}
    >
      {/* Header */}
      <h4 className="text-sm font-semibold text-white mb-4">Uploads</h4>

      {/* Activity List */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                item.status === "error"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/10 text-white/60"
              )}
            >
              {item.status === "error" ? (
                <AlertCircle size={16} />
              ) : (
                <FileText size={16} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90 truncate">{item.name}</p>
              {item.status === "uploading" && item.progress !== undefined && (
                <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-blue to-accent-teal rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === "complete" && item.size && (
                <p className="text-xs text-white/40">{item.size}</p>
              )}
              {item.status === "error" && (
                <p className="text-xs text-red-400">Error</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show All Button */}
      <button className="btn-secondary w-full mt-4 text-xs">Show All</button>
    </div>
  );
}
