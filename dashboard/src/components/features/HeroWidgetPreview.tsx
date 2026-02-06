"use client";

import { BentoCard } from "@/components/ui/BentoCard";
import { motion } from "framer-motion";

export function HeroWidgetPreview() {
  return (
    <BentoCard
      colSpan={2}
      rowSpan={2}
      className="relative overflow-hidden bg-gradient-to-br from-[#E2E6FA] to-[#F3F6FF] dark:from-[#1E2030] dark:to-[#111111] border-none"
    >
      <div className="flex flex-col h-full z-10 relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-sm font-semibold text-primary/60 uppercase tracking-wider">
              Live Preview
            </span>
            <h2 className="text-3xl font-bold mt-1 text-primary">
              Your Assistant
            </h2>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            Edit Bot
          </button>
        </div>

        {/* 3D Floating Element (CSS Only) */}
        <div className="absolute right-[-20px] top-[20%] w-[180px] h-[180px] pointer-events-none opacity-50 md:opacity-100">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-full h-full bg-gradient-to-tr from-purple-400 to-blue-400 rounded-[40px] blur-2xl opacity-60"
          />
        </div>

        {/* Widget Mockup */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-[320px] bg-white dark:bg-black rounded-2xl shadow-xl overflow-hidden border border-border/50">
            {/* Mock Header */}
            <div className="bg-primary p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20" />
              <div>
                <div className="h-2 w-24 bg-white/40 rounded mb-1" />
                <div className="h-1.5 w-16 bg-white/20 rounded" />
              </div>
            </div>
            {/* Mock Chat Body */}
            <div className="p-4 space-y-3 h-[200px] bg-muted/20">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 shrink-0" />
                <div className="bg-muted p-2 rounded-2xl rounded-tl-none text-xs text-muted-foreground w-[70%]">
                  Hello! How can I help you today?
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-primary text-primary-foreground p-2 rounded-2xl rounded-tr-none text-xs w-[60%]">
                  I need help with my account.
                </div>
              </div>
            </div>
            {/* Mock Input */}
            <div className="p-3 border-t border-border/50 flex gap-2">
              <div className="flex-1 h-8 bg-muted rounded-full" />
              <div className="w-8 h-8 bg-primary rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
