"use client";

import { cn } from "@/lib/utils";
import { MessageCircle, MessageSquare, Bot, Hand, Send, X } from "lucide-react";

interface WidgetConfig {
  botName?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  primaryColor?: string;
  fontFamily?: string;
  headerStyle?: "solid" | "gradient" | "minimal";
  theme?: "light" | "dark" | "system";
  position?: "bottom-right" | "bottom-left";
  logoUrl?: string;
  chatBackground?: string;
  chatBackgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  incomingBubbleColor?: string;
  outgoingBubbleColor?: string;
  incomingTextColor?: string;
  outgoingTextColor?: string;
  borderRadius?: number;
  widgetSize?: "compact" | "default" | "large";
  bubbleStyle?: "rounded" | "sharp" | "pill";
  showTimestamps?: boolean;
  typingIndicator?: "dots" | "text" | "pulse";
  launcherIcon?: "chat" | "support" | "robot" | "wave";
  launcherSize?: number;
  windowWidth?: number;
  windowHeight?: number;
}

interface LivePreviewProps {
  primaryColor?: string;
  botName?: string;
  config?: WidgetConfig;
  className?: string;
}

const LAUNCHER_ICONS: Record<string, typeof MessageCircle> = {
  chat: MessageCircle,
  support: MessageSquare,
  robot: Bot,
  wave: Hand,
};

function getBubbleRadius(style?: string) {
  switch (style) {
    case "sharp":
      return "6px";
    case "pill":
      return "20px";
    default:
      return "16px";
  }
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function LivePreview({
  primaryColor: propColor = "#000000",
  botName: propName = "Support Bot",
  config,
  className,
}: LivePreviewProps) {
  const primaryColor = config?.primaryColor || propColor;
  const botName = config?.botName || propName;
  const welcomeMessage =
    config?.welcomeMessage || "Hello! 👋 How can I help you today?";
  const placeholderText = config?.placeholderText || "Type a message...";
  const borderRadius = config?.borderRadius ?? 12;
  const bubbleStyle = config?.bubbleStyle || "rounded";
  const bubbleRadius = getBubbleRadius(bubbleStyle);
  const isDark = config?.theme === "dark";
  const headerStyle = config?.headerStyle || "solid";
  const showTimestamps = config?.showTimestamps ?? false;
  const LauncherIcon =
    LAUNCHER_ICONS[config?.launcherIcon || "chat"] || MessageCircle;

  // Header background
  let headerBg = primaryColor;
  let headerTextColor = "#fff";
  if (headerStyle === "gradient") {
    headerBg = `linear-gradient(135deg, ${primaryColor}, ${adjustColor(
      primaryColor,
      40
    )})`;
  } else if (headerStyle === "minimal") {
    headerBg = isDark ? "#1a1a1a" : "#ffffff";
    headerTextColor = isDark ? "#e5e5e5" : "#1f2937";
  }

  // Chat background
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

  // Bubble colors
  const incomingBg =
    config?.incomingBubbleColor || (isDark ? "#262626" : "#fff");
  const outgoingBg = config?.outgoingBubbleColor || primaryColor;
  const incomingText =
    config?.incomingTextColor || (isDark ? "#e5e5e5" : "#1f2937");
  const outgoingText = config?.outgoingTextColor || "#fff";

  // Corner overrides for bubble style
  const botCornerStyle: React.CSSProperties =
    bubbleStyle === "pill"
      ? {}
      : { borderBottomLeftRadius: bubbleStyle === "sharp" ? "0px" : "4px" };
  const userCornerStyle: React.CSSProperties =
    bubbleStyle === "pill"
      ? {}
      : { borderBottomRightRadius: bubbleStyle === "sharp" ? "0px" : "4px" };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-end pb-4 h-full w-full relative overflow-hidden pt-24",
        className
      )}
    >
      <div className="absolute top-8 left-6 z-10 pointer-events-none opacity-0 md:opacity-100">
        <h3 className="font-bold text-lg text-white">Live Preview</h3>
        <p className="text-sm text-white/50 font-medium">Test your widget</p>
      </div>

      {/* Widget Preview */}
      <div
        className="relative w-full max-w-[280px] shadow-2xl overflow-hidden border transform transition-all md:scale-95 origin-center mx-auto"
        style={{
          borderRadius: `${borderRadius}px`,
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          borderColor: isDark ? "#333" : "#e5e7eb",
          fontFamily: config?.fontFamily || "inherit",
        }}
      >
        {/* Header */}
        <div
          className="p-4 flex justify-between items-center"
          style={{
            background: headerBg,
            color: headerTextColor,
            borderBottom:
              headerStyle === "minimal"
                ? `1px solid ${isDark ? "#333" : "#e5e7eb"}`
                : "none",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor:
                  headerStyle === "minimal"
                    ? primaryColor
                    : "rgba(255,255,255,0.2)",
              }}
            >
              {config?.logoUrl ? (
                <img
                  src={config.logoUrl}
                  className="w-full h-full object-cover"
                  alt="Avatar"
                />
              ) : (
                <LauncherIcon
                  size={14}
                  color={headerStyle === "minimal" ? "#fff" : "currentColor"}
                />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">{botName}</p>
              <p className="text-xs opacity-70">Online</p>
            </div>
          </div>
          <X
            size={18}
            className="opacity-60 cursor-pointer hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Chat Area */}
        <div
          className="h-[220px] p-4 space-y-3 overflow-y-auto"
          style={{
            backgroundColor: isDark ? "#0d0d0d" : "#f9fafb",
            ...chatBg,
          }}
        >
          {/* Bot message */}
          <div className="flex gap-2">
            <div
              className="p-3 text-sm shadow-sm max-w-[85%]"
              style={{
                borderRadius: bubbleRadius,
                backgroundColor: incomingBg,
                color: incomingText,
                ...botCornerStyle,
              }}
            >
              {welcomeMessage}
              {showTimestamps && (
                <span className="block text-[9px] opacity-40 mt-1">
                  12:00 PM
                </span>
              )}
            </div>
          </div>

          {/* User message */}
          <div className="flex gap-2 justify-end">
            <div
              className="p-3 text-sm max-w-[85%]"
              style={{
                borderRadius: bubbleRadius,
                backgroundColor: outgoingBg,
                color: outgoingText,
                ...userCornerStyle,
              }}
            >
              Just testing the look and feel!
              {showTimestamps && (
                <span className="block text-[9px] opacity-50 mt-1">
                  12:01 PM
                </span>
              )}
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex gap-2">
            <div
              className="p-3 text-sm"
              style={{
                borderRadius: bubbleRadius,
                backgroundColor: incomingBg,
                color: incomingText,
                ...botCornerStyle,
                opacity: 0.7,
              }}
            >
              {config?.typingIndicator === "text" ? (
                <span className="italic text-xs opacity-60">Thinking...</span>
              ) : config?.typingIndicator === "pulse" ? (
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: incomingText }}
                />
              ) : (
                <span className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        backgroundColor: incomingText,
                        opacity: 0.5,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div
          className="p-3 border-t"
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            borderColor: isDark ? "#333" : "#e5e7eb",
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              backgroundColor: isDark ? "#0d0d0d" : "#f3f4f6",
            }}
          >
            <input
              type="text"
              placeholder={placeholderText}
              className="bg-transparent text-sm w-full focus:outline-none"
              style={{ color: isDark ? "#e5e5e5" : "#1f2937" }}
              disabled
            />
            <button
              className="p-1.5 rounded-full text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Send size={12} />
            </button>
          </div>
          <div className="text-center mt-2">
            <p
              className="text-[10px]"
              style={{ color: isDark ? "#666" : "#9ca3af" }}
            >
              Powered by Kiosk
            </p>
          </div>
        </div>
      </div>

      {/* Launcher button preview */}
      <div className="mt-4 flex justify-center">
        <div
          className="rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
          style={{
            width: `${Math.min(config?.launcherSize ?? 56, 52)}px`,
            height: `${Math.min(config?.launcherSize ?? 56, 52)}px`,
            backgroundColor: primaryColor,
          }}
        >
          <LauncherIcon
            size={Math.min((config?.launcherSize ?? 56) * 0.4, 20)}
          />
        </div>
      </div>
    </div>
  );
}
