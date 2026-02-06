"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  active = false,
  onClick,
  className,
}: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200",
        "bg-[rgba(255,255,255,0.04)] border border-white/[0.06]",
        "hover:bg-[rgba(255,255,255,0.08)] hover:border-white/[0.1]",
        active && [
          "bg-white/[0.08] border-white/20",
          "shadow-[0_0_24px_rgba(255,255,255,0.05)]",
        ],
        className
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          "bg-[rgba(255,255,255,0.06)]",
          active && "bg-white/[0.12]"
        )}
      >
        <Icon
          size={24}
          className={cn("text-white/60", active && "text-white")}
        />
      </div>
      <span
        className={cn(
          "text-sm font-medium text-white/70",
          active && "text-white"
        )}
      >
        {title}
      </span>
    </button>
  );
}
