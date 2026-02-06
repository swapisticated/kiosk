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
          "bg-[rgba(79,140,255,0.12)] border-[rgba(79,140,255,0.4)]",
          "shadow-[0_0_24px_rgba(79,140,255,0.3)]",
        ],
        className
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          "bg-[rgba(255,255,255,0.06)]",
          active && "bg-[rgba(79,140,255,0.2)]"
        )}
      >
        <Icon
          size={24}
          className={cn("text-white/60", active && "text-accent-blue")}
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
