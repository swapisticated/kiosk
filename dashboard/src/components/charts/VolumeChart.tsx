"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VolumeChartProps {
  data: { date: string; count: number }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.08}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#525252", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            tick={{ fill: "#525252", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(20, 20, 20, 0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "11px",
            }}
            itemStyle={{ color: "#a5b4fc" }}
            cursor={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#818cf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
            activeDot={{ r: 3, fill: "#fff", stroke: "#818cf8" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
