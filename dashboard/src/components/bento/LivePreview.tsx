import { cn } from "@/lib/utils";
import { MessageCircle, Send, X } from "lucide-react";

interface WidgetConfig {
  botName?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  primaryColor?: string;
  fontFamily?: string;
  theme?: "light" | "dark" | "system";
  position?: "bottom-right" | "bottom-left";
  logoUrl?: string;
  chatBackground?: string;
  chatBackgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  incomingBubbleColor?: string;
  outgoingBubbleColor?: string;
  borderRadius?: number;
}

interface LivePreviewProps {
  primaryColor?: string;
  botName?: string;
  config?: WidgetConfig; // Optional full config
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}

export function LivePreview({
  primaryColor: propColor = "#000000",
  botName: propName = "Support Bot",
  config,
  className,
  colSpan = 2,
  rowSpan = 2,
}: LivePreviewProps) {
  // Merge props with config (config takes precedence if present)
  const primaryColor = config?.primaryColor || propColor;
  const botName = config?.botName || propName;
  const welcomeMessage =
    config?.welcomeMessage || "Hello! 👋 How can I help you today?";
  const placeholderText = config?.placeholderText || "Type a message...";

  // Custom Styles
  const chatBg: React.CSSProperties = config?.chatBackground
    ? {
        backgroundImage:
          config.chatBackground.includes("url") ||
          config.chatBackground.includes("gradient")
            ? config.chatBackground
            : undefined,
        backgroundColor: !config.chatBackground.includes("(")
          ? config.chatBackground
          : undefined,
        backgroundSize:
          config.chatBackground.includes("pattern") ||
          config.chatBackgroundStyle === "pattern"
            ? "auto"
            : "cover",
        backgroundRepeat:
          config.chatBackground.includes("pattern") ||
          config.chatBackgroundStyle === "pattern"
            ? "repeat"
            : "no-repeat",
        backgroundPosition: "center",
      }
    : {};

  return (
    <div
      className={cn(
        "rounded-[2rem] bg-card backdrop-blur-xl p-6 shadow-soft relative overflow-hidden flex flex-col items-center justify-center group border border-transparent dark:border-white/10",
        colSpan === 2 ? "col-span-1 md:col-span-2" : `col-span-${colSpan}`,
        rowSpan === 2
          ? "row-span-1 md:row-span-2 min-h-[400px]"
          : `row-span-${rowSpan}`,
        className
      )}
    >
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200">
          Live Preview
        </h3>
        <p className="text-sm text-stone-500 font-medium">Test your widget</p>
      </div>

      {/* Mock Browser/Device or Floating Widget */}
      <div className="relative w-full max-w-xs bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-100 dark:border-zinc-800 transform transition-transform group-hover:scale-[1.02]">
        {/* Header */}
        <div
          className="p-4 flex justify-between items-center text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {config?.logoUrl ? (
                <img
                  src={config.logoUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MessageCircle size={16} />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">{botName}</p>
              <p className="text-xs opacity-90">Online</p>
            </div>
          </div>
          <X size={18} className="opacity-80" />
        </div>

        {/* Chat Area */}
        <div
          className="h-[280px] bg-stone-50 dark:bg-zinc-900/50 p-4 space-y-3 overflow-y-auto"
          style={chatBg}
        >
          <div className="flex gap-2">
            {!config?.chatBackground && ( // Only show avatar if no heavy BG? No, always show.
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px]"
                style={{ backgroundColor: primaryColor }}
              >
                AI
              </div>
            )}

            <div
              className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none text-sm text-stone-700 dark:text-stone-300 shadow-sm max-w-[80%]"
              style={{
                backgroundColor: config?.incomingBubbleColor,
                // If custom color, text might need adjustment. Assume user handles it or we auto-calc.
                // For now let's not force text color unless requested.
              }}
            >
              {welcomeMessage}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <div
              className="bg-stone-200 dark:bg-zinc-700 p-3 rounded-2xl rounded-tr-none text-sm text-stone-800 dark:text-stone-200 max-w-[80%]"
              style={{
                backgroundColor:
                  config?.outgoingBubbleColor || config?.primaryColor, // Default to primary if not set? No, default to gray usually.
                // Actually typical layout: User msg is Primary Color?
                // Let's use config.outgoingBubbleColor if set, else Primary (like WhatsApp).
                // If using primary, text should be white.
                color:
                  config?.outgoingBubbleColor || config?.primaryColor
                    ? "#fff"
                    : undefined,
              }}
            >
              Just testing the look and feel!
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-stone-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 bg-stone-50 dark:bg-zinc-800 px-3 py-2 rounded-full">
            <input
              type="text"
              placeholder={placeholderText}
              className="bg-transparent text-sm w-full focus:outline-none text-stone-800 dark:text-stone-200"
              disabled
            />
            <button
              className="p-1.5 rounded-full text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Send size={14} />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-stone-400">Powered by Kiosk</p>
          </div>
        </div>
      </div>
    </div>
  );
}
