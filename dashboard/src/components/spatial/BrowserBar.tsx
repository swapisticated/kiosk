"use client";

import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Share2,
  Maximize2,
  Lock,
  Check,
} from "lucide-react";
import { useState, useCallback } from "react";

import { TiltPanel } from "./TiltPanel";

interface BrowserBarProps {
  url?: string;
  className?: string;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export function BrowserBar({
  url = "kiosk.app/dashboard",
  className,
  onBack,
  onForward,
  onRefresh,
  canGoBack = false,
  canGoForward = false,
}: BrowserBarProps) {
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 600);
  }, [onRefresh]);

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

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
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            canGoBack
              ? "text-white/40 hover:text-white/70 hover:bg-white/5 cursor-pointer"
              : "text-white/15 cursor-not-allowed"
          )}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            canGoForward
              ? "text-white/40 hover:text-white/70 hover:bg-white/5 cursor-pointer"
              : "text-white/15 cursor-not-allowed"
          )}
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <RotateCw size={14} className={refreshing ? "animate-spin" : ""} />
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
        <button
          onClick={handleShare}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          title="Copy URL"
        >
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Share2 size={14} />
          )}
        </button>
        <button
          onClick={handleFullscreen}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          title="Toggle fullscreen"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </TiltPanel>
  );
}
