import { BentoCard } from "@/components/ui/BentoCard";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsMetricProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  colSpan?: number;
}

export function StatsMetric({
  title,
  value,
  icon,
  description,
  trend,
  trendUp,
  className,
  colSpan,
}: StatsMetricProps) {
  return (
    <BentoCard
      className={cn("flex flex-col justify-between", className)}
      colSpan={colSpan}
    >
      <div className="flex justify-between items-start">
        <div className="p-2 bg-muted rounded-xl">
          {icon || <Activity className="w-5 h-5 text-muted-foreground" />}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trendUp
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {trend}
            {trendUp ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground/60 mt-1">{description}</p>
        )}
      </div>
    </BentoCard>
  );
}
