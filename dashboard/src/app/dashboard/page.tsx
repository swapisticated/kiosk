"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";

// Spatial Components
import { BackgroundLayer } from "@/components/spatial/BackgroundLayer";
import { BrowserBar } from "@/components/spatial/BrowserBar";
import { SpatialSidebar } from "@/components/spatial/SpatialSidebar";
import { RightPanel } from "@/components/spatial/RightPanel";
import { ActivityWidget } from "@/components/spatial/ActivityWidget";
import { FeatureCard } from "@/components/spatial/ui/FeatureCard";
import { TiltPanel } from "@/components/spatial/TiltPanel";

// Views
import { KnowledgeGrid } from "@/components/spatial/views/KnowledgeGrid";
import { StudioEditor } from "@/components/spatial/views/StudioEditor";
import { IntegrationView } from "@/components/spatial/views/IntegrationView";
import { UsageStats } from "@/components/spatial/views/UsageStats";
import { LivePreview } from "@/components/spatial/views/LivePreview";

import { InsightsView } from "@/components/spatial/views/InsightsView";
import { MediaView } from "@/components/spatial/views/MediaView";

// Icons
import {
  FileText,
  Image,
  Lightbulb,
  Video,
  Bot,
  GitBranch,
} from "lucide-react";

// Modals
import { ManageSourcesModal } from "@/components/ManageSourcesModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FEATURE_CARDS = [
  { id: "documents", icon: FileText, title: "Knowledge" },
  { id: "agents", icon: Bot, title: "Studio" },
  { id: "pipelines", icon: GitBranch, title: "Connect" },
  { id: "media", icon: Image, title: "Media" },
  { id: "insights", icon: Lightbulb, title: "Insights" },
];

interface ProgressEvent {
  step: string;
  progress: number;
  message: string;
}

interface Stats {
  totalChats: number;
  totalMessages: number;
  recentChats: any[];
  activity: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // App State
  const [docs, setDocs] = useState<any[]>([]);
  const [ingestionStatus, setIngestionStatus] = useState<
    "idle" | "processing" | "complete" | "failed"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

  // UI State
  const [activeNav, setActiveNav] = useState("files");
  const [activeFeature, setActiveFeature] = useState("documents");
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Customization State
  const [widgetConfig, setWidgetConfig] = useState<any>({});

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if user has a tenant
  useEffect(() => {
    const checkTenant = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(
          `${API_URL}/auth/me?userId=${session.user.id}`,
          {
            headers: {
              "x-dashboard-secret":
                process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
            },
          }
        );
        const data = await res.json();

        if (data.hasTenant && data.tenant?.id) {
          localStorage.setItem("tenantId", data.tenant.id);
          setTenantId(data.tenant.id);
          setWidgetConfig(data.tenant.widgetConfig || {});

          checkData(data.tenant.id);
        } else if (data.requiresReauth) {
          localStorage.removeItem("tenantId");
          localStorage.removeItem("apiKey");
          await signOut({ callbackUrl: "/login" });
        } else {
          router.push("/onboarding");
        }
      } catch (err) {
        console.error("Failed to check tenant:", err);
      }
      setLoading(false);
    };

    if (status === "authenticated") {
      checkTenant();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [session, status, router]);

  // Cleanup SSE
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const checkData = async (tId: string) => {
    try {
      // Fetch Documents
      const headers = {
        "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
        "x-tenant-id": tId,
      };

      const res = await fetch(`${API_URL}/documents`, { headers });
      const data = await res.json();
      const fetchedDocs = data.documents || [];

      setDocs(fetchedDocs);

      // Fetch Stats
      try {
        console.log("Fetching stats from:", `${API_URL}/stats`);
        const statsRes = await fetch(`${API_URL}/stats`, { headers });

        if (!statsRes.ok) {
          console.error(
            "Stats Fetch Error:",
            statsRes.status,
            await statsRes.text()
          );
        } else {
          const statsData = await statsRes.json();
          console.log("Stats Received:", statsData);
          if (!statsData.error) {
            setStats(statsData);
          }
        }
      } catch (e) {
        console.error("Failed to fetch stats:", e);
      }

      // Check for active ingestions
      const activeDoc = fetchedDocs.find(
        (d: any) => d.status === "pending" || d.status === "processing"
      );

      if (activeDoc) {
        setIngestionStatus("processing");
        connectToProgressStream(activeDoc.id, tId);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  const connectToProgressStream = (documentId: string, tId: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const connectSSE = async () => {
      try {
        const response = await fetch(
          `${API_URL}/documents/${documentId}/progress`,
          {
            headers: {
              "x-dashboard-secret":
                process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
              "x-tenant-id": tId,
            },
            signal: abortControllerRef.current?.signal,
          }
        );

        if (!response.ok) return;

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim().startsWith("data: ")) {
              try {
                const event: ProgressEvent = JSON.parse(line.trim().slice(6));

                if (event.progress >= 0) setProgress(event.progress);
                setProgressMessage(event.message);

                if (event.step === "complete") {
                  setIngestionStatus("complete");
                  setTimeout(() => setIngestionStatus("idle"), 5000);
                  checkData(tenantId!); // Refresh docs list
                  return;
                }

                if (event.step === "error") {
                  setIngestionStatus("failed");
                  return;
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("SSE connection error:", err);
        }
      }
    };
    connectSSE();
  };

  const handleAddSource = async (url: string) => {
    if (!tenantId) return;

    try {
      const res = await fetch(`${API_URL}/documents`, {
        method: "POST",
        headers: {
          "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
          "x-tenant-id": tenantId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        checkData(tenantId);
      }
    } catch (err) {
      console.error("Add source failed:", err);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!tenantId) return;

    try {
      await fetch(`${API_URL}/documents/${id}`, {
        method: "DELETE",
        headers: {
          "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
          "x-tenant-id": tenantId,
        },
      });
      checkData(tenantId);
    } catch (err) {
      console.error("Delete source failed:", err);
    }
  };

  const handleUpdateConfig = (key: string, value: any) => {
    setWidgetConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    if (!tenantId) return;
    setSavingConfig(true);
    try {
      await fetch(`${API_URL}/tenants/${tenantId}/config`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
        },
        body: JSON.stringify(widgetConfig),
      });
    } catch (e) {
      console.error("Failed to save config", e);
    } finally {
      setSavingConfig(false);
    }
  };

  // Map ingestion status to Activity Widget
  const activityItems =
    ingestionStatus === "processing"
      ? [
          {
            id: "current-job",
            name: progressMessage || "Processing content...",
            status: "uploading" as const,
            progress: progress,
          },
        ]
      : [];

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-stone-200 font-sans selection:bg-cyan-500/30">
      <BackgroundLayer />
      <BrowserBar
        className="glass"
        url={`kiosk.app/dashboard/${activeFeature}`}
      />

      <div className="scene">
        <div className="curved-dashboard">
          {/* LEFT PANEL: Sidebar */}
          <TiltPanel className="h-full w-[260px] rounded-[28px] bg-black/25 backdrop-blur-2xl flex flex-col overflow-hidden">
            <SpatialSidebar
              activeItem={activeNav}
              onItemClick={setActiveFeature}
              workspaceName="Kiosk"
              className="h-full w-full p-4"
            />
          </TiltPanel>

          {/* CENTER PANEL: Main Content */}
          <TiltPanel className="h-full flex-1 rounded-[28px] bg-black/25 backdrop-blur-2xl flex flex-col overflow-hidden relative group">
            <main className="flex-1 flex flex-col p-8 overflow-hidden pt-20">
              {/* Feature Cards Grid - Always visible? Or maybe minimal when in Studio? 
                  Let's keep it for navigation between modes */}
              <div className="grid grid-cols-5 gap-3 mb-6 shrink-0">
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

              {/* Dynamic View Content */}
              <div className="flex-1 min-h-0 relative">
                <AnimatePresence mode="wait">
                  {activeFeature === "documents" && (
                    <motion.div
                      key="knowledge"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full"
                    >
                      <KnowledgeGrid
                        docs={docs}
                        onAddSource={() => setIsManageSourcesOpen(true)}
                        onDeleteSource={handleDeleteSource}
                      />
                    </motion.div>
                  )}

                  {activeFeature === "agents" && (
                    <motion.div
                      key="studio"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="h-full -mx-4 md:-mx-8" // Negative margin to fill padding
                    >
                      <StudioEditor
                        config={widgetConfig}
                        updateConfig={handleUpdateConfig}
                        onSave={handleSaveConfig}
                        saving={savingConfig}
                        tenantId={tenantId || ""}
                      />
                    </motion.div>
                  )}

                  {activeFeature === "pipelines" && (
                    <motion.div
                      key="pipelines"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full"
                    >
                      <IntegrationView tenantId={tenantId} apiUrl={API_URL} />
                    </motion.div>
                  )}

                  {activeFeature === "insights" && (
                    <motion.div
                      key="insights"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="h-full -mx-4 md:-mx-8"
                    >
                      <InsightsView stats={stats as any} />
                    </motion.div>
                  )}

                  {activeFeature === "media" && (
                    <motion.div
                      key="media"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="h-full -mx-4 md:-mx-8"
                    >
                      <MediaView stats={stats as any} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </main>
          </TiltPanel>

          {/* RIGHT PANEL: Stats & Activity */}
          <div className="h-full w-[280px] flex flex-col gap-4">
            {/* Top Section: Dynamic Content (Impact or Live Preview) */}
            <TiltPanel className="flex-[2] w-full rounded-[28px] bg-black/25 backdrop-blur-2xl flex flex-col overflow-hidden p-0 relative">
              <div className="absolute inset-0 bg-white/5 opacity-50 pointer-events-none" />
              <AnimatePresence mode="wait">
                {activeFeature === "agents" ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -90 }}
                    transition={{ duration: 0.4 }}
                    className="h-full w-full"
                  >
                    <LivePreview config={widgetConfig} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full p-4"
                  >
                    <UsageStats
                      usedAmount={stats?.totalChats || 0}
                      totalAmount={100}
                      stats={stats || { totalChats: 0, totalMessages: 0 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </TiltPanel>

            {/* Bottom Section: Activity */}
            <TiltPanel className="flex-[1] w-full rounded-[28px] bg-black/25 backdrop-blur-2xl flex flex-col overflow-hidden p-4">
              <div className="flex-1 flex flex-col relative">
                <ActivityWidget
                  items={activityItems}
                  className="relative inset-auto right-auto bottom-auto w-full h-full"
                />
              </div>
            </TiltPanel>
          </div>
        </div>
      </div>

      <ManageSourcesModal
        isOpen={isManageSourcesOpen}
        onClose={() => setIsManageSourcesOpen(false)}
        sources={docs.map((d: any) => ({
          id: d.id,
          title: d.title || d.url,
          type: d.sourceType === "scraped" ? "url" : "file",
          status: d.status === "processed" ? "active" : "error",
          date: new Date(d.updatedAt).toLocaleDateString(),
        }))}
        onAddSource={handleAddSource}
        onDeleteSource={handleDeleteSource}
      />
    </div>
  );
}
