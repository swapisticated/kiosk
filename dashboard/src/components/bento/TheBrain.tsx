import { cn } from "@/lib/utils";
import { BrainCircuit, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface TheBrainProps {
  status: "idle" | "processing" | "complete" | "failed";
  progress: number;
  message: string;
  className?: string;
  colSpan?: number;
}

export function TheBrain({
  status,
  progress,
  message,
  className,
  colSpan = 2,
}: TheBrainProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] bg-card backdrop-blur-xl p-6 shadow-soft transition-all duration-300 hover:shadow-hover relative overflow-hidden group border border-transparent dark:border-white/10",
        colSpan === 2 ? "col-span-1 md:col-span-2" : `col-span-${colSpan}`,
        className
      )}
    >
      {/* Background Pulse Effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-10 blur-3xl transition-colors duration-1000",
          status === "processing"
            ? "bg-amber-400"
            : status === "failed"
            ? "bg-red-500"
            : "bg-emerald-400"
        )}
      />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-3 rounded-2xl transition-colors duration-500",
                status === "processing"
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : status === "failed"
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              )}
            >
              {status === "processing" ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : status === "failed" ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <BrainCircuit className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">AI Status</h3>
              <p className="text-sm text-muted-foreground font-medium">
                {status === "processing"
                  ? "Training in progress..."
                  : status === "failed"
                  ? "Training stopped"
                  : "Operational & Ready"}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "h-3 w-3 rounded-full shadow-glow",
              status === "processing"
                ? "bg-amber-500 animate-pulse"
                : status === "failed"
                ? "bg-red-500"
                : "bg-emerald-500"
            )}
          />
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">
              {message || "System idle"}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                status === "processing"
                  ? "bg-amber-500"
                  : status === "failed"
                  ? "bg-red-500"
                  : "bg-emerald-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
