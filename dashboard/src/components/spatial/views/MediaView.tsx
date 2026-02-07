"use client";

import { motion } from "framer-motion";
import { Search, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaViewProps {
  stats: {
    recentChats: any[];
  } | null;
}

export function MediaView({ stats }: MediaViewProps) {
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden p-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Media
          </h2>
          <p className="text-stone-400 text-sm">
            Live conversations and media management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-white transition-colors"
              size={14}
            />
            <input
              placeholder="Search conversations..."
              className="bg-black/20 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:bg-black/40 focus:border-white/20 outline-none w-64 transition-all"
            />
          </div>
          <button className="p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-stone-400 hover:text-white">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-sm font-bold text-white">Live Conversations</h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {stats?.recentChats?.map((chat: any) => (
              <div
                key={chat.id}
                className="group p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer flex gap-3 items-center"
              >
                <div className="relative">
                  <img
                    src={chat.avatar}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                    alt={chat.user}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {chat.user}
                    </h4>
                    <span className="text-[10px] text-stone-500">
                      {new Date(chat.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 truncate group-hover:text-stone-300 transition-colors">
                    {chat.query}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.recentChats || stats.recentChats.length === 0) && (
              <div className="text-center text-stone-600 text-xs py-10">
                No recent conversations
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
