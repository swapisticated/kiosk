"use client";

import { motion } from "framer-motion";

import { useMemo } from "react";

// Custom Chart Components
import { VolumeChart } from "@/components/charts/VolumeChart";
import { TopicCloud } from "@/components/charts/TopicCloud";
import { SentimentGauge } from "@/components/charts/SentimentGauge";

interface InsightsViewProps {
  stats: {
    totalChats: number;
    totalMessages: number;
    avgDuration?: number;
    recentChats: any[];
    activity: any[];
    heatmap?: { day: number; hour: number; count: number }[];
    topKeywords?: { text: string; value: number }[];
    sentiment?: { positive: number; neutral: number; negative: number };
  } | null;
}

function formatDuration(seconds: number) {
  if (!seconds) return "--";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

export function InsightsView({ stats }: InsightsViewProps) {
  const chartData = useMemo(() => {
    if (!stats?.activity) return [];
    return stats.activity.map((d: any) => ({
      date: d.date,
      count: d.count,
    }));
  }, [stats]);

  // Heatmap Data Processing
  // Create 7x24 grid (Days x Hours)
  const heatmapGrid = useMemo(() => {
    const grid = Array(7)
      .fill(0)
      .map(() => Array(24).fill(0));
    stats?.heatmap?.forEach((d) => {
      if (d.day >= 0 && d.day < 7 && d.hour >= 0 && d.hour < 24) {
        grid[d.day][d.hour] = d.count;
      }
    });
    return grid;
  }, [stats?.heatmap]);

  const maxHeat = Math.max(...(stats?.heatmap?.map((d) => d.count) || [0]), 1);

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden px-8">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Insights
          </h2>
          <p className="text-stone-400 text-sm">
            Performance metrics & user intent
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6 shrink-0 px-1"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-xs text-white/50">Chats</span>
          <span className="text-sm font-semibold text-white">
            {stats?.totalChats || 0}
          </span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="text-xs text-white/50">Messages</span>
          <span className="text-sm font-semibold text-white">
            {stats?.totalMessages || 0}
          </span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span className="text-xs text-white/50">Avg. Duration</span>
          <span className="text-sm font-semibold text-white">
            {formatDuration(stats?.avgDuration || 0)}
          </span>
        </div>
      </motion.div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 pb-2">
        {/* Left Column: Activity & Volume (8/12) */}
        <div className="col-span-8 flex flex-col gap-4 h-full min-h-0">
          {/* Main Volume Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-[2] rounded-2xl p-4 bg-white/[0.02] border border-white/5 relative overflow-hidden flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Message Volume
              </h3>
            </div>
            <div className="flex-1 w-full relative min-h-0">
              {chartData.length > 0 ? (
                <VolumeChart data={chartData} />
              ) : (
                <div className="flex items-center justify-center h-full text-stone-500 text-xs">
                  No activity data yet
                </div>
              )}
            </div>
          </motion.div>

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-[3] rounded-2xl p-4  flex flex-col min-h-0"
          >
            <div className="flex-1 flex flex-col justify-between min-h-0 pb-2">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Hourly Activity Heatmap
                </h3>
                <div className="flex items-center gap-1 text-[9px] text-stone-500">
                  <span>Less</span>
                  <div className="w-2 h-2 rounded-[1px] bg-white/5"></div>
                  <div className="w-2 h-2 rounded-[1px] bg-indigo-500/40"></div>
                  <div className="w-2 h-2 rounded-[1px] bg-indigo-500"></div>
                  <span>More</span>
                </div>
              </div>
              {/* Heatmap Grid Implementation */}
              <div className="flex flex-1">
                {/* Day Labels (Left) */}
                <div className="flex flex-col justify-between pr-2 text-[10px] text-stone-500 font-medium py-1">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                {/* Grid */}
                <div className="flex-1 grid grid-cols-24 gap-[2px]">
                  {heatmapGrid.map((dayRow, dIndex) =>
                    dayRow.map((count, hIndex) => {
                      const intensity = count / maxHeat;
                      return (
                        <div
                          key={`${dIndex}-${hIndex}`}
                          className="rounded-[2px] w-full h-full transition-colors"
                          style={{
                            backgroundColor:
                              count > 0
                                ? `rgba(99, 102, 241, ${0.1 + intensity * 0.9})` // indigo
                                : "rgba(255, 255, 255, 0.03)",
                          }}
                          title={`${
                            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                              dIndex
                            ]
                          } ${hIndex}:00 - ${count} msgs`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
              {/* Hour Labels (Bottom) */}
              <div className="flex pl-8 mt-1 justify-between text-[9px] text-stone-600 font-mono">
                <span>12am</span>
                <span>6am</span>
                <span>12pm</span>
                <span>6pm</span>
                <span>11pm</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Topics & Sentiment (4/12) */}
        <div className="col-span-4 flex flex-col gap-4 h-full min-h-0">
          {/* Sentiment Bars */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 bg-white/[0.02] border border-white/5 flex flex-col shrink-0"
          >
            <div className="mb-3 shrink-0">
              <h3 className="text-sm font-bold text-white mb-1">Sentiment</h3>
              <p className="text-xs text-stone-500">
                Overall mood of conversations
              </p>
            </div>
            <SentimentGauge
              positive={stats?.sentiment?.positive || 0}
              neutral={stats?.sentiment?.neutral || 100}
              negative={stats?.sentiment?.negative || 0}
            />
          </motion.div>

          {/* Topics Cloud */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 rounded-2xl p-5 bg-white/[0.02] border border-white/5 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="mb-4 shrink-0">
              <h3 className="text-sm font-bold text-white mb-1">Top Topics</h3>
              <p className="text-xs text-stone-500">
                Extracted keywords from user queries
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <TopicCloud topics={stats?.topKeywords || []} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
