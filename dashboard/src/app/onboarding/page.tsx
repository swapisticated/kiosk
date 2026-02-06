"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {["website", "processing", "complete"].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? "bg-primary w-6"
                  : i < ["website", "processing", "complete"].indexOf(step)
                  ? "bg-primary/60"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 relative overflow-hidden">
          {/* Welcome message with user info */}
          {session?.user && step === "website" && (
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{session.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Website Setup */}
          <div
            className={`transition-all duration-500 ${
              step === "website"
                ? "opacity-100 translate-x-0"
                : "opacity-0 absolute inset-0 translate-x-[-100%] pointer-events-none"
            }`}
          >
            <h1 className="text-2xl font-bold mb-2">Set up your chatbot</h1>
            <p className="text-muted-foreground mb-6">
              We'll train your AI on your website content
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => updateField("websiteUrl", e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bot name{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.botName}
                  onChange={(e) => updateField("botName", e.target.value)}
                  placeholder="e.g., Support Bot"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleCreateBot}
                className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity mt-4"
              >
                Create Chatbot →
              </button>
            </div>
          </div>

          {/* Step 2: Processing */}
          <div
            className={`transition-all duration-500 ${
              step === "processing"
                ? "opacity-100 translate-x-0"
                : "opacity-0 absolute inset-0 translate-x-[100%] pointer-events-none"
            }`}
          >
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold mb-2">
                Setting up your chatbot
              </h1>
              <p className="text-muted-foreground mb-6">{progressMessage}</p>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {progress}% complete
              </p>
            </div>
          </div>

          {/* Step 3: Complete */}
          <div
            className={`transition-all duration-500 ${
              step === "complete"
                ? "opacity-100 translate-x-0"
                : "opacity-0 absolute inset-0 translate-x-[100%] pointer-events-none"
            }`}
          >
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
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

              <h1 className="text-2xl font-bold mb-2">You're all set! 🎉</h1>
              <p className="text-muted-foreground mb-4">
                Redirecting you to your dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
