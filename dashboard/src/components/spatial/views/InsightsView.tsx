"use client";

import { motion } from "framer-motion";
import {
  Users,
  MessageSquare,
  Clock,
  Search,
  MoreHorizontal,
  Flame, // For Heatmap
  Zap,
} from "lucide-react";
import { useMemo } from "react";

interface InsightsViewProps {
  stats: {
    totalChats: number;
    totalMessages: number;
    avgDuration?: number;
    recentChats: any[];
    activity: any[];
    heatmap?: { day: number; hour: number; count: number }[];
    topKeywords?: { text: string; value: number }[];
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
    return stats.activity.map((d: any) => d.count);
  }, [stats]);

  const maxVal = Math.max(...(chartData.length ? chartData : [10]));

  // Create polygon points for SVG (Area Chart)
  const points = chartData
    .map((val: number, i: number) => {
      const x = (i / (chartData.length - 1 || 1)) * 100;
      const y = 100 - (val / maxVal) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const polygonPath = `0,100 ${points} 100,100`;

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

      {/* Hero Stats (Compact) */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <StatCard
          icon={MessageSquare}
          label="Total Chats"
          value={stats?.totalChats || 0}
          color="bg-blue-500/80"
          delay={0}
        />
        <StatCard
          icon={Users}
          label="Total Messages"
          value={stats?.totalMessages || 0}
          color="bg-purple-500/80"
          delay={0.1}
        />
        <StatCard
          icon={Clock}
          label="Avg. Duration"
          value={formatDuration(stats?.avgDuration || 0)}
          color="bg-orange-500/80"
          delay={0.2}
        />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 pb-2">
        {/* Left Column: Activity Charts (8/12) */}
        <div className="col-span-8 flex flex-col gap-4 h-full min-h-0">
          {/* Main Area Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-[2] rounded-2xl p-2 pl-8 pb-4 relative overflow-hidden flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Activity Volume
              </h3>
            </div>
            <div className="flex-1 w-full relative min-h-0 flex flex-col">
              {stats?.activity && stats.activity.length > 0 ? (
                <>
                  <div className="flex-1 relative w-full min-h-0">
                    <svg
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 100"
                    >
                      <defs>
                        <linearGradient
                          id="chartGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#818cf8"
                            stopOpacity="0.5"
                          />
                          <stop
                            offset="100%"
                            stopColor="#818cf8"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      {[0, 25, 50, 75, 100].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="100"
                          y2={y}
                          stroke="white"
                          strokeOpacity="0.1"
                          strokeWidth="0.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      <polygon
                        points={polygonPath}
                        fill="url(#chartGradient)"
                      />
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-[10px] text-stone-500 font-medium -ml-6 py-0 pointer-events-none">
                      <span>{maxVal}</span>
                      <span>{Math.round(maxVal / 2)}</span>
                      <span>0</span>
                    </div>
                  </div>
                  <div className="flex justify-between w-full mt-2 px-1 shrink-0">
                    {stats.activity.map((d: any, i: number) => {
                      if (stats.activity.length > 5 && i % 2 !== 0)
                        return <div key={i} className="w-1" />;
                      return (
                        <span
                          key={i}
                          className="text-[10px] text-stone-500 font-medium"
                        >
                          {new Date(d.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-500 text-xs">
                  No data
                </div>
              )}
            </div>
          </motion.div>

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-[3]  rounded-2xl p-4 flex flex-col min-h-0"
          >
            <div className="flex-1 flex flex-col justify-between min-h-0 pb-2">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                   Hourly Heatmap
                </h3>
                <div className="flex items-center gap-1 text-[9px] text-stone-500">
                  <span>Less</span>
                  <div className="w-2 h-2 rounded-[1px] bg-white/5"></div>
                  <div className="w-2 h-2 rounded-[1px] bg-indigo-500/40"></div>
                  <div className="w-2 h-2 rounded-[1px] bg-indigo-500"></div>
                  <span>More</span>
                </div>
              </div>
              {/* Days Labels and Grid */}
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
                          className="rounded-[6px] w-full h-full transition-colors"
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

        {/* Right Column: User Intent (4/12) */}
        <div className="col-span-4 h-full min-h-0">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="h-full rounded-2xl p-5 flex flex-col min-h-0"
          >
            <div className="mb-4 shrink-0">
              <h3 className="text-sm font-bold text-white mb-1">User Intent</h3>
              <p className="text-xs text-stone-500">
                Top keywords from recent chats
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex flex-wrap gap-2 content-start">
                {stats?.topKeywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-xs font-medium border border-white/5 transition-all hover:bg-white/5 cursor-default"
                    style={{
                      backgroundColor: `rgba(255, 255, 255, ${
                        0.03 +
                        (kw.value / (stats.topKeywords?.[0]?.value || 1)) * 0.1
                      })`,
                      fontSize: `${Math.max(
                        0.7,
                        0.7 +
                          (kw.value / (stats.topKeywords?.[0]?.value || 1)) *
                            0.5
                      )}rem`,
                      opacity:
                        0.6 +
                        (kw.value / (stats.topKeywords?.[0]?.value || 1)) * 0.4,
                    }}
                  >
                    {kw.text}
                    <span className="ml-1.5 opacity-40 text-[9px]">
                      {kw.value}
                    </span>
                  </span>
                ))}
                {(!stats?.topKeywords || stats.topKeywords.length === 0) && (
                  <div className="text-stone-600 text-xs italic">
                    No keywords yet
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Compact Stat Card Component
function StatCard({ icon: Icon, label, value, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-3 flex items-center gap-3 overflow-hidden"
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg shrink-0 ${color}`}
      >
        <Icon size={16} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider truncate">
          {label}
        </span>
        <span className="text-lg font-bold text-white truncate leading-tight">
          {value}
        </span>
      </div>
    </motion.div>
  );
}
