"use client";

import { useState } from "react";
import { BackgroundLayer } from "@/components/spatial/BackgroundLayer";
import { BrowserBar } from "@/components/spatial/BrowserBar";
import { SpatialSidebar } from "@/components/spatial/SpatialSidebar";
import { RightPanel } from "@/components/spatial/RightPanel";
import { UsageStats } from "@/components/spatial/views/UsageStats";
import { ActivityWidget } from "@/components/spatial/ActivityWidget";
import { FeatureCard } from "@/components/spatial/ui/FeatureCard";
import { ListRow } from "@/components/spatial/ui/ListRow";
import {
  LayoutGrid,
  FileText,
  Image,
  Lightbulb,
  Layers,
  Video,
  Bot,
  GitBranch,
  Database,
  Workflow,
  FileCode,
  Filter,
  Share2,
  Plus,
} from "lucide-react";

// Feature cards data - adapted for AI chatbot/agent context
const FEATURE_CARDS = [
  { id: "agents", icon: Bot, title: "Agents" },
  { id: "documents", icon: FileText, title: "Documents" },
  { id: "pipelines", icon: GitBranch, title: "Pipelines" },
  { id: "media", icon: Image, title: "Conversation History" },
  { id: "insights", icon: Lightbulb, title: "Insights" },
  { id: "templates", icon: Layers, title: "Templates" },
];

const FEATURE_CARDS_ROW2 = [
  { id: "workflows", icon: Workflow, title: "Workflows" },
  { id: "training", icon: Video, title: "Training" },
];

// Project items data
const PROJECT_ITEMS = [
  {
    id: "1",
    name: "Motion",
    date: "Yesterday",
    size: "12.3 GB",
    icon: Bot,
    iconColor: "bg-purple-500/20 text-purple-400",
  },
  {
    id: "2",
    name: "Sound Assets",
    date: "18 Jun, 2022",
    size: "1.2 GB",
    icon: Database,
    iconColor: "bg-cyan-500/20 text-cyan-400",
  },
  {
    id: "3",
    name: "Documents",
    date: "18 Jun, 2022",
    size: "0.5 GB",
    icon: FileText,
    iconColor: "bg-blue-500/20 text-blue-400",
  },
  {
    id: "4",
    name: "Payte - Web.fig",
    date: "18 Jun, 2022",
    size: "2.1 GB",
    icon: FileCode,
    iconColor: "bg-pink-500/20 text-pink-400",
  },
  {
    id: "5",
    name: "Payte - Design system",
    date: "18 Jun, 2022",
    size: "3.7 GB",
    icon: Layers,
    iconColor: "bg-amber-500/20 text-amber-400",
  },
];

export default function SpatialDashboard() {
  const [activeNav, setActiveNav] = useState("files");
  const [activeFeature, setActiveFeature] = useState("workflows");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundLayer />

      <div className="scene">
        <div className="curved-dashboard">
          {/* Edge Vignette - CRITICAL for curvature illusion */}
          {/* <div
            className="pointer-events-none absolute inset-0 rounded-[42px] z-50"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)",
            }}
          /> */}

          {/* LEFT PANEL: Sidebar */}
          <div className="h-full w-[260px] rounded-[28px] bg-black/25 backdrop-blur-2xl border border-white/10 flex flex-col overflow-hidden">
            <SpatialSidebar
              activeItem={activeNav}
              onItemClick={setActiveNav}
              workspaceName="Kiosk"
              className="h-full w-full p-4"
            />
          </div>

          {/* CENTER PANEL: Main Content */}
          <div className="h-full flex-1 rounded-[28px] bg-black/25 backdrop-blur-2xl border border-white/10 flex flex-col overflow-hidden relative group">
            <BrowserBar url="kiosk.app/dashboard" />

            <main className="flex-1 flex flex-col p-8 overflow-hidden">
              <div className="grid grid-cols-6 gap-3 mb-3">
                    {FEATURE_CARDS.map((card) => (
                      <FeatureCard
                        key={card.id}
                        icon={card.icon}
                        title={card.title}
                        active={activeFeature === card.id}
                        onClick={() => setActiveFeature(card.id)}
                      />
                    ))}
                  </div>

                  {/* Feature Cards Grid - Row 2 (partial) */}
                  <div className="grid grid-cols-6 gap-3 mb-6">
                    {FEATURE_CARDS_ROW2.map((card) => (
                      <FeatureCard
                        key={card.id}
                        icon={card.icon}
                        title={card.title}
                        active={activeFeature === card.id}
                        onClick={() => setActiveFeature(card.id)}
                      />
                    ))}
                  </div>

                  {/* Projects Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold text-white">
                        Projects
                      </h2>
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary flex items-center gap-2 text-xs">
                          <Filter size={14} /> Filter
                        </button>
                        <button className="btn-secondary flex items-center gap-2 text-xs">
                          <Share2 size={14} /> Share
                        </button>
                        <button className="btn-primary flex items-center gap-2 text-xs py-2 px-4">
                          <Plus size={14} /> Create
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                      {PROJECT_ITEMS.map((item) => (
                        <ListRow
                          key={item.id}
                          icon={item.icon}
                          iconColor={item.iconColor}
                          name={item.name}
                          date={item.date}
                          meta={item.size}
                        />
                      ))}
                    </div>
                  </div>
            </main>
          </div>

          {/* RIGHT PANEL: Stats & Activity */}
          <div className="h-full w-[300px] rounded-[28px] bg-black/25 backdrop-blur-2xl border border-white/10 flex flex-col overflow-hidden p-4 gap-4">
            <div className="flex-1">
              <UsageStats usedAmount={42} totalAmount={100} unit="GB" />
            </div>

            <div className="h-auto">
              <ActivityWidget className="relative inset-auto right-auto bottom-auto w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
