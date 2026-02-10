"use client";

import { Tag } from "lucide-react";

interface TopicCloudProps {
  topics: { text: string; value: number }[];
}

export function TopicCloud({ topics }: TopicCloudProps) {
  if (!topics || topics.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/20">
        <div className="bg-white/5 p-3 rounded-full mb-2">
          <Tag size={20} />
        </div>
        <span className="text-xs">No topics detected yet.</span>
      </div>
    );
  }

  // Find max value to normalize sizes
  const max = Math.max(...topics.map((t) => t.value));

  return (
    <div className="flex flex-wrap gap-2 py-2 content-start h-full overflow-y-auto custom-scrollbar">
      {topics.map((topic, i) => {
        // Calculate size: min 0.75rem, max 1.25rem
        const size = 0.75 + (topic.value / max) * 0.5;
        const opacity = 0.6 + (topic.value / max) * 0.4;

        return (
          <span
            key={i}
            className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-default flex items-center gap-1.5"
            style={{
              fontSize: `${size}rem`,
              opacity: opacity,
            }}
            title={`${topic.value} occurrences`}
          >
            {topic.text}
            <span className="text-[0.6em] opacity-50 font-mono bg-black/20 px-1 rounded">
              {topic.value}
            </span>
          </span>
        );
      })}
    </div>
  );
}
