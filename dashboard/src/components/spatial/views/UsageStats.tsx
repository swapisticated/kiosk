"use client";

import { cn } from "@/lib/utils";
import { ProgressRing } from "../ui/ProgressRing";
import { ArrowRight, Bot, GitBranch, Database, Music } from "lucide-react";

interface UsageItem {
  icon: typeof Bot;
  label: string;
  value: string;
  color: string;
}

interface UsageStatsProps {
  usedAmount?: number;
  totalAmount?: number;
  unit?: string;
  stats?: {
    totalChats: number;
    totalMessages: number;
  };
}

const USAGE_ITEMS: UsageItem[] = [
  { icon: Bot, label: "Agents", value: "Active", color: "bg-blue-500" },
  {
    icon: GitBranch,
    label: "Pipelines",
    value: "Connected",
    color: "bg-purple-500",
  },
  {
    icon: Database,
    label: "Knowledge",
    value: "3 Sources",
    color: "bg-cyan-500",
  },
];

export function UsageStats({
  usedAmount = 0,
  totalAmount = 100,
  unit = " chats",
  stats,
}: UsageStatsProps) {
  // Use real stats if available
  const currentVal = stats?.totalChats || usedAmount;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h3 className="text-sm font-semibold text-white">Impact</h3>
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center mb-6">
        <ProgressRing
          value={currentVal}
          max={totalAmount}
          size={140}
          strokeWidth={12}
          label={`${currentVal}`}
          sublabel={`total chats`}
        />
      </div>

      {/* Usage Breakdown */}
      <div className="flex flex-col gap-3 mb-6">
        {USAGE_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-1">
            <div className={cn("w-2 h-2 rounded-full", item.color)} />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <item.icon size={14} className="text-white/50 shrink-0" />
              <span className="text-xs text-white/60 truncate">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-medium text-white/80">
              {item.value}
            </span>
          </div>
        ))}
        {stats && (
          <div className="flex items-center gap-3 px-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-white/50 text-[10px]">MSG</span>
              <span className="text-xs text-white/60 truncate">Messages</span>
            </div>
            <span className="text-xs font-medium text-white/80">
              {stats.totalMessages}
            </span>
          </div>
        )}
      </div>

      {/* CTA Button */}
      {/* <button className="btn-primary text-sm mt-auto">Upgrade plan</button> */}
    </div>
  );
}
