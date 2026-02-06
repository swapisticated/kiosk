"use client";

import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Share2,
  Maximize2,
  Lock,
} from "lucide-react";

import { TiltPanel } from "./TiltPanel";

interface BrowserBarProps {
  url?: string;
  className?: string;
}

export function BrowserBar({
  url = "kiosk.app/dashboard",
  className,
}: BrowserBarProps) {
  return (
    <TiltPanel
      className={cn( 
        "absolute  left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-2",
        "bg-[#0a0a0c]/10 backdrop-blur-2xl",
        "border border-white/10 rounded-full",
        "shadow-2xl shadow-black/50",
        className
      )}
    >
      {/* Navigation controls */}
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <ChevronRight size={16} />
        </button>
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <RotateCw size={14} />
        </button>
      </div>

      {/* URL field */}
      <div className="flex items-center gap-2 bg-white/7 px-4 py-1.5 rounded-lg min-w-[280px]">
        <Lock size={12} className="text-emerald-400" />
        <span className="text-sm text-white/60 font-medium tracking-wide">
          {url}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <Share2 size={14} />
        </button>
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <Maximize2 size={14} />
        </button>
      </div>
    </TiltPanel>
  );
}
