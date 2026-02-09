"use client";

import { motion } from "framer-motion";
import { BackgroundLayer } from "./BackgroundLayer";
import { BrowserBar } from "./BrowserBar";
import { TiltPanel } from "./TiltPanel";

export function LoadingState() {
  return (
    <div className="relative min-h-screen overflow-hidden text-stone-200 font-sans selection:bg-cyan-500/30">
      <BackgroundLayer />
      <BrowserBar className="glass" url="kiosk.app/loading..." />

      <div className="scene flex items-center justify-center relative">
        {/* Surreal Hologram Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {/* Core Glow */}
          <motion.div
            className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Ring 1 - Outer Slow */}
          <motion.div
            className="absolute w-[600px] h-[600px] border border-white/5 rounded-full"
            style={{
              borderTopColor: "rgba(255,255,255,0.1)",
              borderRightColor: "transparent",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Ring 2 - Middle Reverse */}
          <motion.div
            className="absolute w-[400px] h-[400px] border border-cyan-500/10 rounded-full"
            style={{
              borderLeftColor: "rgba(6, 182, 212, 0.2)",
              borderBottomColor: "transparent",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          {/* Ring 3 - Inner Fast */}
          <motion.div
            className="absolute w-[200px] h-[200px] border border-white/5 rounded-full"
            style={{ borderTopColor: "rgba(255,255,255,0.2)" }}
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Floating text */}
          <motion.div
            className="absolute mt-64 text-xs font-mono tracking-[0.4em] text-white/40 uppercase mix-blend-overlay"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Constructing Reality
          </motion.div>
        </div>

        <div className="curved-dashboard relative z-10">
          {/* LEFT PANEL: Sidebar Skeleton */}
          <TiltPanel className="h-full w-[260px] rounded-[28px] bg-black/25 backdrop-blur-2xl flex flex-col overflow-hidden p-4">
            <div className="space-y-4 animate-pulse">
              <div className="h-8 w-3/4 bg-white/10 rounded-lg" />
              <div className="space-y-2 mt-8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 w-full bg-white/5 rounded-lg" />
                ))}
              </div>
            </div>
          </TiltPanel>

          {/* CENTER PANEL: Main Content Skeleton */}
          <TiltPanel className="h-full flex-1 rounded-[28px] bg-black/25 backdrop-blur-2xl flex flex-col overflow-hidden relative p-8">
            <div className="mt-16 animate-pulse space-y-8">
              {/* Feature Cards Skeleton */}
              <div className="grid grid-cols-5 gap-3 mb-6  shrink-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-2xl" />
                ))}
              </div>

              {/* Content Skeleton - Matches KnowledgeGrid Layout */}
              <div className="flex-1 flex flex-col min-h-0 h-full space-y-6">
                {/* Header & Actions */}
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-white/10 rounded-lg" />
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-white/5 rounded-lg" />
                    <div className="h-8 w-20 bg-white/5 rounded-lg" />
                    <div className="h-8 w-28 bg-white/10 rounded-lg" />
                  </div>
                </div>

                {/* List Rows */}
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 w-full bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-4"
                      style={{ opacity: 1 - i * 0.1 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 bg-white/10 rounded" />
                        <div className="h-2 w-1/4 bg-white/5 rounded" />
                      </div>
                      <div className="w-16 h-6 rounded-full bg-white/5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TiltPanel>

          {/* RIGHT PANEL: Stats Skeleton */}
          <div className="h-full w-[280px] flex flex-col gap-4">
            {/* Top Skeleton */}
            <TiltPanel className="flex-[2] w-full rounded-[28px] bg-black/25 backdrop-blur-2xl p-4">
              <div className="h-full w-full bg-white/5 rounded-xl animate-pulse" />
            </TiltPanel>

            {/* Bottom Skeleton - Activity/Uploads Widget */}
            <TiltPanel className="flex-[1] w-full rounded-[28px] bg-black/25 backdrop-blur-2xl p-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header: "Uploads" */}
                <div className="h-4 w-16 bg-white/10 rounded" />

                {/* File Items */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-white/10 rounded" />
                      <div className="h-1 w-full bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 bg-white/10 rounded" />
                      <div className="h-2 w-1/3 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: "Show All" Button */}
              <div className="h-8 w-full bg-white/5 rounded-xl border border-white/5" />
            </TiltPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
