import { cn } from "@/lib/utils";
import { Palette, PenLine } from "lucide-react";

interface AppearanceProps {
  primaryColor: string;
  botName: string;
  onCustomize: () => void;
  className?: string;
  colSpan?: number;
}

export function Appearance({
  primaryColor,
  botName,
  onCustomize,
  className,
  colSpan = 2,
}: AppearanceProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] bg-card backdrop-blur-xl p-6 shadow-soft group border border-transparent dark:border-white/10 h-full flex flex-col justify-between",
        colSpan === 2 ? "col-span-1 md:col-span-2" : `col-span-${colSpan}`,
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-stone-100 dark:bg-white/10 rounded-xl text-stone-600 dark:text-stone-300">
            <Palette size={20} />
          </div>
          <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">
            Appearance
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-2 border-white/20 shadow-md"
              style={{ backgroundColor: primaryColor }}
            />
            <div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                Brand Color
              </p>
              <p className="text-xs text-stone-500 uppercase">{primaryColor}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onCustomize}
        className="w-full mt-6 bg-stone-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <PenLine size={16} /> Open Studio
      </button>
    </div>
  );
}
