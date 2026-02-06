import { cn } from "@/lib/utils";
import { FileText, Globe, RefreshCcw, ExternalLink } from "lucide-react";

interface Source {
  id: string;
  title: string;
  type: "url" | "file";
  status: "active" | "error";
  date: string;
}

interface KnowledgeBaseProps {
  sources: Source[];
  className?: string;
  colSpan?: number;
  onManage?: () => void;
}

export function KnowledgeBase({
  sources = [],
  className,
  colSpan = 1,
  onManage,
}: KnowledgeBaseProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] bg-card backdrop-blur-xl p-6 shadow-soft flex flex-col border border-transparent dark:border-white/10",
        colSpan === 1 ? "col-span-1" : `col-span-${colSpan}`,
        className
      )}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">
          Knowledge Base
        </h3>
        <button className="p-2 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-stone-200">
          <RefreshCcw size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[200px] pr-1 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-white/10">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors group border border-transparent dark:border-white/5"
          >
            <div className="p-2 rounded-xl bg-white dark:bg-white/10 text-stone-500 dark:text-stone-300 shadow-sm">
              {source.type === "url" ? (
                <Globe size={16} />
              ) : (
                <FileText size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate text-stone-700 dark:text-stone-200">
                {source.title}
              </h4>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                {source.date}
              </p>
            </div>
          </div>
        ))}

        {sources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center mb-3 text-stone-400 dark:text-stone-500">
              <div className="border-2 border-dashed border-current rounded-lg w-6 h-6" />
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">
              No sources connected
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-600 mt-1">
              Ingest your website to start.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onManage}
        className="mt-4 w-full py-3 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-bold hover:opacity-90 transition-opacity"
      >
        Manage Sources
      </button>
    </div>
  );
}
