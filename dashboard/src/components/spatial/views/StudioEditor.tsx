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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  incomingTextColor?: string;
  outgoingTextColor?: string;
  borderRadius?: number;
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
  { id: "chat", label: "Chat Theme", icon: MessageSquare },
];

const PRESET_COLORS = [
  "#000000",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#16A34A",
];

const WALLPAPER_PATTERNS = [
  "url('https://www.transparenttextures.com/patterns/cubes.png')",
  "url('https://www.transparenttextures.com/patterns/stardust.png')",
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(to top, #accbee 0%, #e7f0fd 100%)",
];

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
            className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-stone-200 disabled:opacity-50 text-sm transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
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
                  isActive ? "text-white" : "text-stone-400 hover:text-stone-200"
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
      <div className="flex-1 overflow-y-auto px-8 pb-32 no-scrollbar">
        <div className="max-w-2xl space-y-8">
          {/* Magic Banner - Only show on Branding or General? or always? Let's keep it generally accessible or stick to branding. 
              Actually, keeping it at top is fine. */}
          <div className="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wand2 className="text-violet-400" size={16} /> Magic Match
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
                  className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
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
          <div className="space-y-6">
            {activeTab === "general" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
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
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:bg-black/40 focus:border-blue-500/50 outline-none transition-all placeholder:text-stone-600"
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
              </motion.div>
            )}

            {activeTab === "branding" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-6">
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
              </motion.div>
            )}

            {activeTab === "interface" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
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
                        // @ts-ignore
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
                      <span className="text-sm font-medium">Bottom Right</span>
                      <div className="w-8 h-5 bg-stone-700/50 border border-white/10 rounded-md" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "chat" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Wallpaper */}
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-3 uppercase tracking-wider">
                    Wallpaper
                  </label>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <button
                      onClick={() => updateConfig("chatBackground", "")}
                      className="aspect-square rounded-xl bg-black/20 border border-white/10 flex items-center justify-center text-stone-500 hover:text-white hover:bg-black/40 hover:border-white/20 transition-all"
                    >
                      <span className="text-xs">None</span>
                    </button>
                    {WALLPAPER_PATTERNS.map((pat, i) => (
                      <button
                        key={i}
                        onClick={() => updateConfig("chatBackground", pat)}
                        className="aspect-square rounded-xl border border-white/10 hover:border-white/50 hover:scale-105 transition-all shadow-sm"
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

                {/* Bubbles */}
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
                         <span className="text-xs font-bold text-white drop-shadow-md">Select</span>
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
                         <span className="text-xs font-bold text-white drop-shadow-md">Select</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
