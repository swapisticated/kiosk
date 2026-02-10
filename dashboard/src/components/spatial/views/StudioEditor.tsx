"use client";

import { useState } from "react";
import {
  Wand2,
  PaintBucket,
  Layout,
  MessageSquare,
  Type,
  Monitor,
  Moon,
  Sun,
  Image as ImageIcon,
  Link,
  Loader2,
  Zap,
  Volume2,
  VolumeX,
  MessageCircle,
  Bot,
  Sparkles,
  Hand,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface WidgetConfig {
  // General
  botName?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  // Branding
  primaryColor?: string;
  fontFamily?: string;
  headerStyle?: "solid" | "gradient" | "minimal";
  logoUrl?: string;
  // Interface
  theme?: "light" | "dark" | "system";
  position?: "bottom-right" | "bottom-left";
  borderRadius?: number;
  widgetSize?: "compact" | "default" | "large";
  launcherIcon?: "chat" | "support" | "robot" | "wave";
  launcherSize?: number;
  windowWidth?: number;
  windowHeight?: number;
  // Chat Theme
  chatBackground?: string;
  chatBackgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  incomingBubbleColor?: string;
  outgoingBubbleColor?: string;
  incomingTextColor?: string;
  outgoingTextColor?: string;
  bubbleStyle?: "rounded" | "sharp" | "pill";
  showTimestamps?: boolean;
  typingIndicator?: "dots" | "text" | "pulse";
  // Behavior
  autoOpen?: boolean;
  autoOpenDelay?: number;
  soundEnabled?: boolean;
  persistChat?: boolean;
}

interface StudioEditorProps {
  config: WidgetConfig;
  updateConfig: (key: keyof WidgetConfig, value: any) => void;
  onSave: () => Promise<void>;
  saving?: boolean;
  tenantId: string;
}

const TABS = [
  { id: "general", label: "General", icon: Type },
  { id: "branding", label: "Branding", icon: PaintBucket },
  { id: "interface", label: "Interface", icon: Layout },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "behavior", label: "Behavior", icon: Zap },
];

const PRESET_COLORS = [
  "#000000",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#16A34A",
  "#0891B2",
  "#4F46E5",
];

const FONT_OPTIONS = [
  {
    id: "system",
    label: "System Default",
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  { id: "inter", label: "Inter", value: "'Inter', sans-serif" },
  { id: "poppins", label: "Poppins", value: "'Poppins', sans-serif" },
  { id: "roboto", label: "Roboto", value: "'Roboto', sans-serif" },
  { id: "outfit", label: "Outfit", value: "'Outfit', sans-serif" },
  { id: "dm-sans", label: "DM Sans", value: "'DM Sans', sans-serif" },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    value: "'Space Grotesk', sans-serif",
  },
];

const WALLPAPER_PATTERNS = [
  "url('https://www.transparenttextures.com/patterns/cubes.png')",
  "url('https://www.transparenttextures.com/patterns/stardust.png')",
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(to top, #accbee 0%, #e7f0fd 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
];

const LAUNCHER_ICONS: {
  id: string;
  icon: typeof MessageCircle;
  label: string;
}[] = [
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "support", icon: MessageSquare, label: "Support" },
  { id: "robot", icon: Bot, label: "Robot" },
  { id: "wave", icon: Hand, label: "Wave" },
];

// ─── Reusable Field Components ──────────────────────────────

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-medium text-stone-400 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-xs font-mono text-white/60">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </div>
  );
}

function ToggleField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:bg-black/30 transition-colors"
      onClick={() => onChange(!value)}
    >
      <div>
        <span className="text-sm font-medium text-white">{label}</span>
        {description && (
          <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        )}
      </div>
      <div
        className={cn(
          "w-10 h-5 rounded-full transition-colors relative",
          value ? "bg-blue-500" : "bg-white/10"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform",
            value ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string; icon?: typeof Sun }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              value === opt.id
                ? "bg-white/15 text-white border border-white/20"
                : "bg-black/20 text-stone-400 border border-white/5 hover:bg-black/40 hover:text-stone-200"
            )}
          >
            {opt.icon && <opt.icon size={12} />}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function StudioEditor({
  config,
  updateConfig,
  onSave,
  saving = false,
  tenantId,
}: StudioEditorProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState("");

  const handleMagicAnalysis = async () => {
    if (!analysisUrl) return;
    setAnalyzing(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${API_URL}/tenants/${tenantId}/analyze-theme`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
        },
        body: JSON.stringify({ url: analysisUrl }),
      });
      if (res.ok) {
        const { config: newConfig } = await res.json();
        Object.entries(newConfig).forEach(([key, value]) => {
          updateConfig(key as keyof WidgetConfig, value);
        });
      }
    } catch (e) {
      console.error("Magic analysis failed", e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-transparent">
      {/* Top Header & Tabs */}
      <div className="shrink-0 px-8 py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Studio</h2>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-white/10 text-white px-6 py-2 rounded-xl font-bold hover:bg-white/20 disabled:opacity-50 text-sm transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Floating Tab Bar */}
        <div className="flex items-center gap-1 p-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-full w-fit">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all relative flex items-center gap-2",
                  isActive
                    ? "text-white"
                    : "text-stone-400 hover:text-stone-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="studio-tab"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={14} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-8 pb-32">
        <div className="max-w-2xl space-y-8">
          {/* Magic Banner */}
          <div className="bg-white/2 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wand2 className="text-white" size={16} /> Magic Match
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Extract brand colors from your website.
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  value={analysisUrl}
                  onChange={(e) => setAnalysisUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 w-full md:w-48"
                />
                <button
                  onClick={handleMagicAnalysis}
                  disabled={analyzing}
                  className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {analyzing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Analyze"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* ─── GENERAL TAB ─── */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">
                      Bot Name
                    </label>
                    <input
                      value={config.botName || ""}
                      onChange={(e) => updateConfig("botName", e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:bg-black/40 focus:border-blue-500/50 outline-none transition-all placeholder:text-stone-600"
                      placeholder="e.g. Acme Support"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">
                      Welcome Message
                    </label>
                    <textarea
                      rows={3}
                      value={config.welcomeMessage || ""}
                      onChange={(e) =>
                        updateConfig("welcomeMessage", e.target.value)
                      }
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:bg-black/40 focus:border-blue-500/50 outline-none transition-all placeholder:text-stone-600 resize-none"
                      placeholder="Hello! How can I help?"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">
                      Placeholder Text
                    </label>
                    <input
                      value={config.placeholderText || ""}
                      onChange={(e) =>
                        updateConfig("placeholderText", e.target.value)
                      }
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:bg-black/40 focus:border-blue-500/50 outline-none transition-all placeholder:text-stone-600"
                      placeholder="Type a message..."
                    />
                  </div>
                </div>
              )}

              {/* ─── BRANDING TAB ─── */}
              {activeTab === "branding" && (
                <div className="space-y-6">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">
                      Primary Color
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateConfig("primaryColor", c)}
                          className={cn(
                            "w-10 h-10 rounded-full transition-all hover:scale-110 ring-2 ring-offset-2 ring-offset-[#0A0A0A]",
                            config.primaryColor === c
                              ? "ring-white scale-110"
                              : "ring-transparent opacity-70 hover:opacity-100"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <div className="relative group">
                        <input
                          type="color"
                          value={config.primaryColor || "#000000"}
                          onChange={(e) =>
                            updateConfig("primaryColor", e.target.value)
                          }
                          className="w-10 h-10 rounded-full opacity-0 absolute inset-0 cursor-pointer z-10"
                        />
                        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 text-white group-hover:bg-white/10 transition-colors">
                          <PaintBucket size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">
                      Font Family
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => updateConfig("fontFamily", font.value)}
                          className={cn(
                            "p-3 rounded-xl border transition-all text-left",
                            config.fontFamily === font.value
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-black/20 border-white/5 text-stone-400 hover:bg-black/40 hover:text-stone-200"
                          )}
                          style={{ fontFamily: font.value }}
                        >
                          <span className="text-sm font-medium">
                            {font.label}
                          </span>
                          <span className="block text-[10px] opacity-50 mt-0.5">
                            The quick brown fox
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Header Style */}
                  <SelectField
                    label="Header Style"
                    options={[
                      { id: "solid", label: "Solid" },
                      { id: "gradient", label: "Gradient" },
                      { id: "minimal", label: "Minimal" },
                    ]}
                    value={config.headerStyle || "solid"}
                    onChange={(v) => updateConfig("headerStyle", v)}
                  />

                  {/* Logo URL */}
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">
                      Logo URL
                    </label>
                    <div className="flex gap-3">
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden">
                        {config.logoUrl ? (
                          <img
                            src={config.logoUrl}
                            className="w-full h-full object-cover"
                            alt="Logo"
                          />
                        ) : (
                          <ImageIcon className="text-stone-600" size={20} />
                        )}
                      </div>
                      <input
                        value={config.logoUrl || ""}
                        onChange={(e) =>
                          updateConfig("logoUrl", e.target.value)
                        }
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 text-sm text-white focus:bg-black/40 focus:border-blue-500/50 outline-none transition-all placeholder:text-stone-600"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── INTERFACE TAB ─── */}
              {activeTab === "interface" && (
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "light", icon: Sun, label: "Light" },
                        { id: "dark", icon: Moon, label: "Dark" },
                        { id: "system", icon: Monitor, label: "Auto" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => updateConfig("theme", opt.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                            config.theme === opt.id
                              ? "bg-white text-black border-white shadow-lg shadow-white/10"
                              : "bg-black/20 text-stone-400 border-white/5 hover:bg-black/40 hover:text-stone-200"
                          )}
                        >
                          <opt.icon size={20} />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">
                      Position
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => updateConfig("position", "bottom-left")}
                        className={cn(
                          "flex-1 p-4 rounded-xl border transition-all flex items-center gap-3",
                          config.position === "bottom-left"
                            ? "bg-white/10 border-white/30 text-white"
                            : "bg-black/20 border-white/5 text-stone-400 hover:bg-black/40"
                        )}
                      >
                        <div className="w-8 h-5 bg-stone-700/50 border border-white/10 rounded-md" />
                        <span className="text-sm font-medium">Bottom Left</span>
                      </button>
                      <button
                        onClick={() => updateConfig("position", "bottom-right")}
                        className={cn(
                          "flex-1 p-4 rounded-xl border transition-all flex items-center justify-end gap-3",
                          config.position === "bottom-right"
                            ? "bg-white/10 border-white/30 text-white"
                            : "bg-black/20 border-white/5 text-stone-400 hover:bg-black/40"
                        )}
                      >
                        <span className="text-sm font-medium">
                          Bottom Right
                        </span>
                        <div className="w-8 h-5 bg-stone-700/50 border border-white/10 rounded-md" />
                      </button>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <SliderField
                    label="Border Radius"
                    value={config.borderRadius ?? 12}
                    min={0}
                    max={24}
                    onChange={(v) => updateConfig("borderRadius", v)}
                  />

                  {/* Widget Size */}
                  <SelectField
                    label="Widget Size"
                    options={[
                      { id: "compact", label: "Compact" },
                      { id: "default", label: "Default" },
                      { id: "large", label: "Large" },
                    ]}
                    value={config.widgetSize || "default"}
                    onChange={(v) => updateConfig("widgetSize", v)}
                  />

                  {/* Window Dimensions */}
                  <SliderField
                    label="Window Width"
                    value={config.windowWidth ?? 360}
                    min={320}
                    max={440}
                    step={10}
                    onChange={(v) => updateConfig("windowWidth", v)}
                  />
                  <SliderField
                    label="Window Height"
                    value={config.windowHeight ?? 480}
                    min={400}
                    max={600}
                    step={10}
                    onChange={(v) => updateConfig("windowHeight", v)}
                  />

                  {/* Launcher Icon */}
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">
                      Launcher Icon
                    </label>
                    <div className="flex gap-3">
                      {LAUNCHER_ICONS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => updateConfig("launcherIcon", item.id)}
                          className={cn(
                            "w-14 h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                            (config.launcherIcon || "chat") === item.id
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-black/20 border-white/5 text-stone-500 hover:bg-black/40 hover:text-stone-300"
                          )}
                        >
                          <item.icon size={18} />
                          <span className="text-[8px] uppercase tracking-wider">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Launcher Size */}
                  <SliderField
                    label="Launcher Size"
                    value={config.launcherSize ?? 56}
                    min={48}
                    max={72}
                    step={4}
                    onChange={(v) => updateConfig("launcherSize", v)}
                  />
                </div>
              )}

              {/* ─── CHAT THEME TAB ─── */}
              {activeTab === "chat" && (
                <div className="space-y-6">
                  {/* Wallpaper */}
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">
                      Wallpaper
                    </label>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <button
                        onClick={() => updateConfig("chatBackground", "")}
                        className={cn(
                          "aspect-square rounded-xl border flex items-center justify-center transition-all",
                          !config.chatBackground
                            ? "bg-black/40 border-white/20 text-white"
                            : "bg-black/20 border-white/10 text-stone-500 hover:text-white hover:bg-black/40 hover:border-white/20"
                        )}
                      >
                        <span className="text-xs">None</span>
                      </button>
                      {WALLPAPER_PATTERNS.map((pat, i) => (
                        <button
                          key={i}
                          onClick={() => updateConfig("chatBackground", pat)}
                          className={cn(
                            "aspect-square rounded-xl border hover:scale-105 transition-all shadow-sm",
                            config.chatBackground === pat
                              ? "border-white/40 ring-1 ring-white/20"
                              : "border-white/10 hover:border-white/30"
                          )}
                          style={{ background: pat }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 items-center bg-black/20 border border-white/10 rounded-xl px-3 py-1">
                      <Link size={16} className="text-stone-500" />
                      <input
                        value={config.chatBackground || ""}
                        onChange={(e) =>
                          updateConfig("chatBackground", e.target.value)
                        }
                        className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-stone-600 outline-none"
                        placeholder="Or paste an image URL..."
                      />
                    </div>
                  </div>

                  {/* Bubble Style */}
                  <SelectField
                    label="Bubble Style"
                    options={[
                      { id: "rounded", label: "Rounded" },
                      { id: "sharp", label: "Sharp" },
                      { id: "pill", label: "Pill" },
                    ]}
                    value={config.bubbleStyle || "rounded"}
                    onChange={(v) => updateConfig("bubbleStyle", v)}
                  />

                  {/* Bubble Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">
                        My Bubble
                      </label>
                      <div className="relative h-12 w-full rounded-xl overflow-hidden border border-white/10">
                        <input
                          type="color"
                          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer"
                          value={
                            config.outgoingBubbleColor ||
                            config.primaryColor ||
                            "#000000"
                          }
                          onChange={(e) =>
                            updateConfig("outgoingBubbleColor", e.target.value)
                          }
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                          <span className="text-xs font-bold text-white drop-shadow-md">
                            Select
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">
                        Bot Bubble
                      </label>
                      <div className="relative h-12 w-full rounded-xl overflow-hidden border border-white/10">
                        <input
                          type="color"
                          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer"
                          value={config.incomingBubbleColor || "#f5f5f5"}
                          onChange={(e) =>
                            updateConfig("incomingBubbleColor", e.target.value)
                          }
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                          <span className="text-xs font-bold text-white drop-shadow-md">
                            Select
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <SelectField
                    label="Typing Indicator"
                    options={[
                      { id: "dots", label: "⠿ Dots" },
                      { id: "text", label: "Thinking..." },
                      { id: "pulse", label: "◉ Pulse" },
                    ]}
                    value={config.typingIndicator || "dots"}
                    onChange={(v) => updateConfig("typingIndicator", v)}
                  />

                  {/* Timestamps */}
                  <ToggleField
                    label="Show Timestamps"
                    description="Display time below each message"
                    value={config.showTimestamps ?? false}
                    onChange={(v) => updateConfig("showTimestamps", v)}
                  />
                </div>
              )}

              {/* ─── BEHAVIOR TAB ─── */}
              {activeTab === "behavior" && (
                <div className="space-y-4">
                  <ToggleField
                    label="Auto-Open Widget"
                    description="Automatically open the chat window when page loads"
                    value={config.autoOpen ?? false}
                    onChange={(v) => updateConfig("autoOpen", v)}
                  />

                  {config.autoOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 border-l-2 border-white/10"
                    >
                      <SliderField
                        label="Auto-Open Delay"
                        value={config.autoOpenDelay ?? 3}
                        min={1}
                        max={10}
                        unit="s"
                        onChange={(v) => updateConfig("autoOpenDelay", v)}
                      />
                    </motion.div>
                  )}

                  <ToggleField
                    label="Sound Notifications"
                    description="Play a subtle sound when a new message arrives"
                    value={config.soundEnabled ?? false}
                    onChange={(v) => updateConfig("soundEnabled", v)}
                  />

                  <ToggleField
                    label="Persist Chat History"
                    description="Remember conversations across page reloads"
                    value={config.persistChat ?? false}
                    onChange={(v) => updateConfig("persistChat", v)}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
