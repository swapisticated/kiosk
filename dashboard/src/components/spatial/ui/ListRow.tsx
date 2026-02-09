"use client";

import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ListRowProps {
  icon?: LucideIcon;
  iconColor?: string;
  name: string;
  date: string;
  meta?: string;
  status?: "success" | "error" | "pending";
  onMenuClick?: () => void;
  className?: string;
}

export function ListRow({
  icon: Icon,
  iconColor = "bg-accent-blue/20 text-accent-blue",
  name,
  date,
  meta,
  status,
  onMenuClick,
  className,
}: ListRowProps) {
  return (
    <div className={cn("list-row group", className)}>
      {/* Left: Icon + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              iconColor
            )}
          >
            <Icon size={18} />
          </div>
        )}
        <span className="text-sm font-medium text-white/90 truncate">
          {name}
        </span>
      </div>

      {/* Middle: Date */}
      <div className="w-28 text-sm text-white/50 hidden sm:block">{date}</div>

      {/* Right: Meta/Size */}
      {meta && (
        <div className="w-20 text-sm text-white/50 text-right hidden md:block">
          {meta}
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <div className="w-16 flex justify-center">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              status === "success" && "bg-emerald-400",
              status === "error" && "bg-red-400",
              status === "pending" && "bg-amber-400 animate-pulse"
            )}
          />
        </div>
      )}

      {/* Overflow Menu */}
      {/* Overflow Menu */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreHorizontal size={18} />
        </button>
      )}
    </div>
  );
}
