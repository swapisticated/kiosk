import { cn } from "@/lib/utils";
import { TrendingUp, Users, MessageSquare, MessageCircleCodeIcon } from "lucide-react";

interface ImpactMetricsProps {
  totalConversations: number;
  totalMessages: number;
  className?: string;
  colSpan?: number;
}

export function ImpactMetrics({
  totalConversations,
  totalMessages,
  className,
  colSpan = 1,
}: ImpactMetricsProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] bg-card backdrop-blur-xl p-6 shadow-soft flex flex-col justify-between border border-transparent dark:border-white/10",
        colSpan === 1 ? "col-span-1" : `col-span-${colSpan}`,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-emerald-500 w-5 h-5" />
        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">
          Impact
        </h3>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-stone-500 font-medium mb-1 flex items-center gap-2">
            <Users size={14} /> Total Chats
          </p>
          <p className="text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {totalConversations.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-stone-500 font-medium mb-1 flex items-center gap-2">
            <MessageCircleCodeIcon size={14} /> Messages
          </p>
          <p className="text-2xl font-bold text-stone-700 dark:text-stone-300">
            {totalMessages.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          +12% this week
        </span>
      </div>
    </div>
  );
}
