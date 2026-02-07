"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BackgroundLayer } from "@/components/spatial/BackgroundLayer";

type Step = "website" | "processing" | "complete";

interface FormData {
  websiteUrl: string;
  botName: string;
}

interface ProgressEvent {
  step: string;
  progress: number;
  message: string;
  pagesFound?: number;
  currentPage?: number;
  totalPages?: number;
  chunksProcessed?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState<Step>("website");
  const [formData, setFormData] = useState<FormData>({
    websiteUrl: "",
    botName: "",
  });
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Starting...");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check if user already has a tenant
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

        if (data.hasTenant) {
          // User already has a tenant, go to dashboard
          localStorage.setItem("tenantId", data.tenant.id);
          router.push("/dashboard");
        } else if (data.requiresReauth) {
          // User was deleted from DB - sign out to recreate on next login
          localStorage.removeItem("tenantId");
          localStorage.removeItem("apiKey");
          await signOut({ callbackUrl: "/login" });
        }
      } catch (err) {
        console.error("Failed to check tenant:", err);
      }
    };

    if (session?.user?.id) {
      checkTenant();
    }
  }, [session, router]);

  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const connectToProgressStream = (documentId: string, apiKey: string) => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Note: EventSource doesn't support custom headers, so we'll use fetch with ReadableStream
    const connectSSE = async () => {
      try {
        const response = await fetch(
          `${API_URL}/documents/${documentId}/progress`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to connect to progress stream");
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: ProgressEvent = JSON.parse(line.slice(6));
                console.log("[SSE] Event:", event);

                // Update progress
                if (event.progress >= 0) {
                  setProgress(event.progress);
                }
                setProgressMessage(event.message);

                // Handle completion
                if (event.step === "complete") {
                  setStep("complete");
                  setTimeout(() => {
                    router.push("/dashboard");
                  }, 1500);
                  return;
                }

                // Handle error
                if (event.step === "error") {
                  setError(event.message);
                  setStep("website");
                  return;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        console.error("SSE connection error:", err);
      }
    };

    connectSSE();
  };

  const handleCreateBot = async () => {
    if (!formData.websiteUrl.trim()) {
      setError("Please enter your website URL");
      return;
    }

    // Validate URL
    try {
      new URL(formData.websiteUrl);
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    if (!session?.user?.id || !session?.user?.email) {
      setError("Session expired. Please log in again.");
      router.push("/login");
      return;
    }

    setStep("processing");
    setProgress(5);
    setProgressMessage("Creating your account...");

    try {
      // Step 1: Create tenant
      const tenantRes = await fetch(`${API_URL}/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
        },
        body: JSON.stringify({
          userId: session.user.id,
          name: session.user.name || formData.botName || "My Bot",
          email: session.user.email,
          domain: new URL(formData.websiteUrl).hostname,
        }),
      });

      if (!tenantRes.ok) {
        const errData = await tenantRes.json();
        throw new Error(errData.error || "Failed to create tenant");
      }

      const { tenant } = await tenantRes.json();
      setProgress(10);
      setProgressMessage("Generating API keys...");

      // Step 2: Generate API key
      const keyRes = await fetch(`${API_URL}/tenants/${tenant.id}/keys`, {
        method: "POST",
        headers: {
          "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
        },
      });

      if (!keyRes.ok) throw new Error("Failed to generate API key");
      const { apiKey } = await keyRes.json();

      // Store tenant info
      localStorage.setItem("tenantId", tenant.id);
      localStorage.setItem("apiKey", apiKey);

      setProgress(15);
      setProgressMessage("Starting website ingestion...");

      // Step 3: Start ingestion and get document ID
      const ingestRes = await fetch(`${API_URL}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: formData.websiteUrl,
          title: formData.botName || tenant.name,
        }),
      });

      if (!ingestRes.ok) {
        console.warn("Ingestion request failed, continuing to dashboard...");
      }

      // Instead of waiting, redirect to dashboard immediately
      // The dashboard will pick up the processing status automatically
      setProgress(100);
      setProgressMessage("Redirecting to dashboard...");
      setStep("complete");

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("website");
    }
  };

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <BackgroundLayer />
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
          <div className="relative w-full h-full rounded-full border-2 border-white/10 border-t-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      <BackgroundLayer />

      <div className="w-full max-w-lg relative z-10 px-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-3 mb-12">
          {["website", "processing", "complete"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step === s
                  ? "w-8 bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                  : i < ["website", "processing", "complete"].indexOf(step)
                  ? "w-2 bg-white/40"
                  : "w-2 bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="relative group">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 bg-gradient-to-br from-white/10 to-transparent rounded-[40px] blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000" />

          <div className="relative rounded-[32px] bg-black/40 backdrop-blur-3xl border border-white/10 p-8 md:p-12 shadow-2xl overflow-hidden">
            {/* Inner highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            {/* Welcome message with user info - Re-styled */}
            {session?.user && step === "website" && (
              <div className="relative flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                {session.user.image ? (
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-white/20 blur-md" />
                    <img
                      src={session.user.image}
                      alt=""
                      className="relative w-12 h-12 rounded-full border border-white/20"
                    />
                  </div>
                ) : (
                  <div className="relative w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {session.user.name?.[0] || "U"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-lg font-medium text-white tracking-wide">
                    {session.user.name}
                  </p>
                  <p className="text-sm text-white/40 font-light">
                    {session.user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Website Setup */}
            <div
              className={`transition-all duration-500 ${
                step === "website"
                  ? "opacity-100 translate-x-0 relative z-10"
                  : "opacity-0 absolute inset-0 translate-x-[-100%] pointer-events-none"
              }`}
            >
              <h1 className="text-3xl font-light text-white mb-3">
                Configure <span className="font-semibold">Agent</span>
              </h1>
              <p className="text-white/50 font-light mb-8 text-lg">
                Connect your knowledge base source
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider text-white/40 font-medium ml-1">
                    Website URL
                  </label>
                  <div className="relative group/input">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-white/5 rounded-2xl opacity-0 group-hover/input:opacity-100 transition-opacity blur" />
                    <input
                      type="url"
                      value={formData.websiteUrl}
                      onChange={(e) =>
                        updateField("websiteUrl", e.target.value)
                      }
                      placeholder="https://yourcompany.com"
                      className="relative w-full px-5 py-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:bg-white/5 focus:border-white/20 transition-all font-light"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider text-white/40 font-medium ml-1">
                    Agent Name{" "}
                    <span className="text-white/20 normal-case tracking-normal ml-1">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative group/input">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-white/5 rounded-2xl opacity-0 group-hover/input:opacity-100 transition-opacity blur" />
                    <input
                      type="text"
                      value={formData.botName}
                      onChange={(e) => updateField("botName", e.target.value)}
                      placeholder="e.g., Support Assistant"
                      className="relative w-full px-5 py-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:bg-white/5 focus:border-white/20 transition-all font-light"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreateBot}
                  className="w-full py-4 px-6 mt-4 rounded-xl font-medium transition-all relative overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-white/10 group-hover/btn:bg-white/20 transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                  <span className="relative text-white flex items-center justify-center gap-2">
                    Initialize Agent
                    <svg
                      className="w-4 h-4 transition-transform group-hover/btn:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            {/* Step 2: Processing */}
            <div
              className={`transition-all duration-500 ${
                step === "processing"
                  ? "opacity-100 translate-x-0 relative z-10"
                  : "opacity-0 absolute inset-0 translate-x-[100%] pointer-events-none"
              }`}
            >
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-8 relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
                  <div className="relative w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-8 h-8 text-white animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        className="opacity-100"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </div>

                <h1 className="text-2xl font-light text-white mb-2">
                  System Initialization
                </h1>
                <p className="text-white/50 text-lg font-light mb-8 animate-pulse">
                  {progressMessage}
                </p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs font-mono text-white/30">
                  <span>PROCESSING</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>

            {/* Step 3: Complete */}
            <div
              className={`transition-all duration-500 ${
                step === "complete"
                  ? "opacity-100 translate-x-0 relative z-10"
                  : "opacity-0 absolute inset-0 translate-x-[100%] pointer-events-none"
              }`}
            >
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-8 relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-20" />
                  <div className="relative w-full h-full rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                <h1 className="text-3xl font-light text-white mb-2">Ready</h1>
                <p className="text-white/50 text-lg font-light mb-4">
                  Entering Dashboard environment...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
