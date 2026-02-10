"use client";

interface SentimentGaugeProps {
  positive: number;
  neutral: number;
  negative: number;
}

export function SentimentGauge({
  positive,
  neutral,
  negative,
}: SentimentGaugeProps) {
  const total = positive + neutral + negative;

  if (total === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
        No sentiment data yet
      </div>
    );
  }

  const bars = [
    { label: "Positive", value: positive, color: "bg-emerald-500" },
    { label: "Neutral", value: neutral, color: "bg-stone-500" },
    { label: "Negative", value: negative, color: "bg-red-400" },
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {bars.map((bar) => (
        <div key={bar.label} className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/70">{bar.label}</span>
            <span className="text-white/50 font-mono">{bar.value}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full ${bar.color} transition-all duration-500`}
              style={{ width: `${bar.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
