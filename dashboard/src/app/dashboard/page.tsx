"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

// Spatial Components
import { BackgroundLayer } from "@/components/spatial/BackgroundLayer";
import { BrowserBar } from "@/components/spatial/BrowserBar";
import { SpatialSidebar } from "@/components/spatial/SpatialSidebar";
import { RightPanel } from "@/components/spatial/RightPanel";
import { ActivityWidget } from "@/components/spatial/ActivityWidget";
import { FeatureCard } from "@/components/spatial/ui/FeatureCard";
import { ListRow } from "@/components/spatial/ui/ListRow";

// Icons
import {
  FileText,
  Image,
  Lightbulb,
  Layers,
  Video,
  Bot,
  GitBranch,
  Workflow,
  Globe,
  Filter,
  Share2,
  Plus,
} from "lucide-react";

// Modals
import { ManageSourcesModal } from "@/components/ManageSourcesModal";
import { CustomizationModal } from "@/components/CustomizationModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Feature cards data
const FEATURE_CARDS = [
  { id: "agents", icon: Bot, title: "Agents" }, // Maps to Customization
  { id: "documents", icon: FileText, title: "Documents" }, // Maps to KnowledgeBase
  { id: "pipelines", icon: GitBranch, title: "Pipelines" },
  { id: "media", icon: Image, title: "Media" },
  { id: "insights", icon: Lightbulb, title: "Insights" },
  { id: "templates", icon: Layers, title: "Templates" },
];

const FEATURE_CARDS_ROW2 = [
  { id: "workflows", icon: Workflow, title: "Workflows" },
  { id: "training", icon: Video, title: "Training" },
];

interface ProgressEvent {
  step: string;
  progress: number;
  message: string;
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
  const [stats, setStats] = useState({ totalChats: 0, totalMessages: 0 });

  // UI State
  const [activeNav, setActiveNav] = useState("files");
  const [activeFeature, setActiveFeature] = useState("documents");
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

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
        const statsRes = await fetch(`${API_URL}/stats`, { headers });
        const statsData = await statsRes.json();
        if (!statsData.error) {
          setStats(statsData);
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

  const handleSaveConfig = async (newConfig: any) => {
    if (!tenantId) return;
    try {
      setWidgetConfig(newConfig);
      await fetch(`${API_URL}/tenants/${tenantId}/config`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
        },
        body: JSON.stringify(newConfig),
      });
    } catch (e) {
      console.error("Failed to save config", e);
    }
  };

  const handleFeatureClick = (id: string) => {
    setActiveFeature(id);
    if (id === "agents") {
      setIsCustomizationOpen(true);
    }
    // 'documents' is the default view so we just set active feature
  };

  // Transform docs for ListRow
  const projectItems = docs.map((d) => ({
    id: d.id,
    name: d.title || d.url || "Untitled Document",
    date: new Date(d.updatedAt).toLocaleDateString(),
    size: d.sourceType === "scraped" ? "URL" : "File", // Meta mapped to type
    icon: d.sourceType === "scraped" ? Globe : FileText,
    iconColor:
      d.sourceType === "scraped"
        ? "bg-purple-500/20 text-purple-400"
        : "bg-blue-500/20 text-blue-400",
    status:
      d.status === "processed"
        ? ("success" as const)
        : d.status === "failed" || d.status === "error"
        ? ("error" as const)
        : ("pending" as const),
  }));

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

      

      <div className="scene">
        <div className="curved-dashboard">
       

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
            <BrowserBar url={`kiosk.app/dashboard/${activeFeature}`} />

            <main className="flex-1 flex flex-col p-8 overflow-hidden pt-20">
              {/* Feature Cards Grid - Row 1 */}
              <div className="grid grid-cols-6 gap-3 mb-3">
                {FEATURE_CARDS.map((card) => (
                  <FeatureCard
                    key={card.id}
                    icon={card.icon}
                    title={card.title}
                    active={activeFeature === card.id}
                    onClick={() => handleFeatureClick(card.id)}
                  />
                ))}
              </div>

              {/* Feature Cards Grid - Row 2 */}
              <div className="grid grid-cols-6 gap-3 mb-6">
                {FEATURE_CARDS_ROW2.map((card) => (
                  <FeatureCard
                    key={card.id}
                    icon={card.icon}
                    title={card.title}
                    active={activeFeature === card.id}
                    onClick={() => handleFeatureClick(card.id)}
                  />
                ))}
              </div>

              {/* Projects (Documents) Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white">
                    Knowledge Base
                  </h2>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary flex items-center gap-2 text-xs">
                      <Filter size={14} /> Filter
                    </button>
                    <button className="btn-secondary flex items-center gap-2 text-xs">
                      <Share2 size={14} /> Share
                    </button>
                    <button
                      onClick={() => setIsManageSourcesOpen(true)}
                      className="btn-primary flex items-center gap-2 text-xs py-2 px-4"
                    >
                      <Plus size={14} /> Add Source
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                  {projectItems.length > 0 ? (
                    projectItems.map((item) => (
                      <ListRow
                        key={item.id}
                        icon={item.icon}
                        iconColor={item.iconColor}
                        name={item.name}
                        date={item.date}
                        meta={item.size}
                        status={item.status}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10 text-white/40 text-sm">
                      No documents found. Click "Add Source" to begin.
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>

          {/* RIGHT PANEL: Stats & Activity */}
          <div className="h-full w-[300px] rounded-[28px] bg-black/25 backdrop-blur-2xl border border-white/10 flex flex-col overflow-hidden p-4 gap-4">
            <div className="flex-1">
              <RightPanel
                usedAmount={stats.totalChats}
                totalAmount={100} // Target?
                unit=" chats"
                className="p-0 border-none w-full"
              />
            </div>

            <div className="h-auto">
              <ActivityWidget
                items={activityItems}
                className="relative inset-auto right-auto bottom-auto w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Rendered outside the scene context if possible, or using portals */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        initialConfig={widgetConfig}
        tenantId={tenantId || ""}
        onSave={handleSaveConfig}
      />

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
