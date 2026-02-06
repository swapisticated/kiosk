"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wand2,
  PaintBucket,
  Layout,
  MessageSquare,
  Type,
  Monitor,
  Moon,
  Sun,
  Smartphone,
  Loader2,
  Image as ImageIcon,
  Link,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LivePreview } from "./bento/LivePreview";

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

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: WidgetConfig;
  tenantId: string;
  onSave: (config: WidgetConfig) => Promise<void>;
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

export function CustomizationModal({
  isOpen,
  onClose,
  initialConfig,
  tenantId,
  onSave,
}: CustomizationModalProps) {
  const [config, setConfig] = useState<WidgetConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState("general");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setConfig(initialConfig);
  }, [isOpen, initialConfig]);

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

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
        setConfig((prev) => ({ ...prev, ...newConfig }));
      }
    } catch (e) {
      console.error("Magic analysis failed", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(config);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-10 z-[101] bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden"
          >
            {/* Sidebar / Tabs */}
            <div className="w-20 md:w-64 border-r border-white/5 bg-white/5 flex flex-col">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white hidden md:block">
                  Studio
                </h2>
                <Wand2 className="text-purple-400 md:hidden" />
              </div>
              <div className="flex-1 space-y-2 px-3">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
                    )}
                  >
                    <tab.icon size={18} />
                    <span className="hidden md:block">{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-white/5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-stone-200 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Config Form (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 pb-32">
                {/* Magic Banner */}
                <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Wand2 className="text-violet-400" size={20} /> Magic
                        Match
                      </h3>
                      <p className="text-sm text-stone-400 mt-1">
                        Found a theme you like? Enter URL to extract colors.
                      </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <input
                        value={analysisUrl}
                        onChange={(e) => setAnalysisUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 w-full md:w-64"
                      />
                      <button
                        onClick={handleMagicAnalysis}
                        disabled={analyzing}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                      >
                        {analyzing ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          "Analyze"
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* render content based on tab */}
                {activeTab === "general" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-2xl font-bold text-white">
                      General Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">
                          Bot Name
                        </label>
                        <input
                          value={config.botName || ""}
                          onChange={(e) =>
                            updateConfig("botName", e.target.value)
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g. Acme Support"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">
                          Welcome Message
                        </label>
                        <textarea
                          rows={3}
                          value={config.welcomeMessage || ""}
                          onChange={(e) =>
                            updateConfig("welcomeMessage", e.target.value)
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Hello! How can I help?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">
                          Placeholder Text
                        </label>
                        <input
                          value={config.placeholderText || ""}
                          onChange={(e) =>
                            updateConfig("placeholderText", e.target.value)
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                          placeholder="Type a message..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "branding" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-2xl font-bold text-white">Branding</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-stone-400 mb-3">
                          Primary Color
                        </label>
                        <div className="flex gap-3 flex-wrap">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => updateConfig("primaryColor", c)}
                              className={cn(
                                "w-10 h-10 rounded-full transition-transform hover:scale-110 ring-2 ring-offset-2 ring-offset-[#0A0A0A]",
                                config.primaryColor === c
                                  ? "ring-white"
                                  : "ring-transparent"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          <div className="relative">
                            <input
                              type="color"
                              value={config.primaryColor || "#000000"}
                              onChange={(e) =>
                                updateConfig("primaryColor", e.target.value)
                              }
                              className="w-10 h-10 rounded-full opacity-0 absolute inset-0 cursor-pointer"
                            />
                            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 text-white">
                              <PaintBucket size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">
                          Logo URL
                        </label>
                        <div className="flex gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            {config.logoUrl ? (
                              <img
                                src={config.logoUrl}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="text-stone-600" />
                            )}
                          </div>
                          <input
                            value={config.logoUrl || ""}
                            onChange={(e) =>
                              updateConfig("logoUrl", e.target.value)
                            }
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-white outline-none"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "interface" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-2xl font-bold text-white">Interface</h3>
                    <div>
                      <label className="block text-sm font-medium text-stone-400 mb-3">
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
                                ? "bg-white text-black border-white"
                                : "bg-white/5 text-stone-400 border-white/5 hover:bg-white/10"
                            )}
                          >
                            <opt.icon size={24} />
                            <span className="text-sm font-medium">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-400 mb-3">
                        Position
                      </label>
                      <div className="flex gap-4">
                        <button
                          onClick={() =>
                            updateConfig("position", "bottom-left")
                          }
                          className={cn(
                            "flex-1 p-4 rounded-xl border border-white/10 flex items-center gap-3 hover:bg-white/5",
                            config.position === "bottom-left"
                              ? "bg-white/10 border-white/50"
                              : "bg-white/5"
                          )}
                        >
                          <div className="w-6 h-4 bg-stone-700 rounded-sm" />{" "}
                          <span className="text-stone-300">Left</span>
                        </button>
                        <button
                          onClick={() =>
                            updateConfig("position", "bottom-right")
                          }
                          className={cn(
                            "flex-1 p-4 rounded-xl border border-white/10 flex items-center justify-end gap-3 hover:bg-white/5",
                            config.position === "bottom-right"
                              ? "bg-white/10 border-white/50"
                              : "bg-white/5"
                          )}
                        >
                          <span className="text-stone-300">Right</span>{" "}
                          <div className="w-6 h-4 bg-stone-700 rounded-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "chat" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-2xl font-bold text-white">
                      Chat Theme
                    </h3>

                    {/* Wallpaper */}
                    <div>
                      <label className="block text-sm font-medium text-stone-400 mb-3">
                        Wallpaper
                      </label>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <button
                          onClick={() => updateConfig("chatBackground", "")}
                          className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-500 hover:text-white hover:bg-white/10"
                        >
                          None
                        </button>
                        {WALLPAPER_PATTERNS.map((pat, i) => (
                          <button
                            key={i}
                            onClick={() => updateConfig("chatBackground", pat)}
                            className="aspect-square rounded-xl border border-white/10 hover:border-white/50 transition-all"
                            style={{ background: pat }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Link size={16} className="text-stone-500" />
                        <input
                          value={config.chatBackground || ""}
                          onChange={(e) =>
                            updateConfig("chatBackground", e.target.value)
                          }
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-stone-600 outline-none"
                          placeholder="Or paste an image URL..."
                        />
                      </div>
                    </div>

                    {/* Bubbles */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">
                          My Bubble
                        </label>
                        <input
                          type="color"
                          className="w-full h-10 rounded-lg bg-transparent cursor-pointer"
                          value={
                            config.outgoingBubbleColor ||
                            config.primaryColor ||
                            "#000000"
                          }
                          onChange={(e) =>
                            updateConfig("outgoingBubbleColor", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">
                          Bot Bubble
                        </label>
                        <input
                          type="color"
                          className="w-full h-10 rounded-lg bg-transparent cursor-pointer"
                          value={config.incomingBubbleColor || "#f5f5f5"}
                          onChange={(e) =>
                            updateConfig("incomingBubbleColor", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Panel (Sticky or Fixed) */}
              <div className="hidden xl:flex w-[400px] border-l border-white/5 bg-black/40 items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="relative z-10 w-full transform scale-90 origin-center">
                  <LivePreview
                    // Passing custom props via style override or modifying LivePreview
                    // For now, LivePreview only takes primaryColor and botName. I'll patch it next.
                    primaryColor={config.primaryColor || "#000000"}
                    botName={config.botName || "Assistant"}
                    // We need to pass the full config to LivePreview to see other changes
                    // @ts-ignore
                    config={config}
                  />
                  <div className="text-center mt-6">
                    <p className="text-stone-500 text-sm">Live Preview</p>
                    <p className="text-stone-600 text-xs">
                      Updates in real-time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
