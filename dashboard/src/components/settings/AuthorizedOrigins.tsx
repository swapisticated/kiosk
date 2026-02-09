"use client";

import { useState, useEffect } from "react";
import { Plus, X, Globe, ShieldCheck, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthorizedOrigins() {
  const [origins, setOrigins] = useState<string[]>([]);
  const [newOrigin, setNewOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tenantId =
    typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
  const dashboardSecret = process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "";

  useEffect(() => {
    if (tenantId) {
      fetchConfig();
    }
  }, [tenantId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tenants/${tenantId}/config`);
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      setOrigins(data.allowedOrigins || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveOrigins = async (updatedOrigins: string[]) => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/tenants/${tenantId}/config`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-secret": dashboardSecret,
        },
        body: JSON.stringify({
          allowedOrigins: updatedOrigins,
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes");

      setOrigins(updatedOrigins);
      setSuccess("Settings saved successfully");

      // Clear success message after 3s
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAddWrapper = () => {
    if (!newOrigin.trim()) return;

    // Basic validation
    let originToAdd = newOrigin.trim();

    // Auto-add protocol if missing (for UX, though strict format is better)
    if (
      !originToAdd.startsWith("http://") &&
      !originToAdd.startsWith("https://")
    ) {
      originToAdd = "https://" + originToAdd;
    }

    // Validate URL format
    try {
      const url = new URL(originToAdd);
      // We only want the origin (protocol + host + port), no path
      originToAdd = url.origin;
    } catch (e) {
      setError("Invalid URL format. Use https://example.com");
      return;
    }

    if (origins.includes(originToAdd)) {
      setError("Domain is already authorized");
      return;
    }

    const updated = [...origins, originToAdd];
    saveOrigins(updated);
    setNewOrigin("");
  };

  const handleRemove = (originToRemove: string) => {
    const updated = origins.filter((o) => o !== originToRemove);
    saveOrigins(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddWrapper();
    }
  };

  if (!tenantId) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {/* Input Section - Minimal Bar */}
        <div className="relative group max-w-xl">
          <div className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-4 transition-all focus-within:border-white/20 focus-within:bg-black/50">
            <Globe size={18} className="teauthorized domainxt-stone-400 mr-3" />
            <input
              type="text"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add authorized domain (e.g. https://myapp.com)"
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-stone-600 h-10"
            />
            <button
              onClick={handleAddWrapper}
              disabled={saving || !newOrigin}
              className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-xs text-stone-500 pl-4">
          Allowed origins for the chatbot widget. Localhost is supported for
          development.
        </p>

        {/* Error/Success Messages */}
        <div className="h-6">
          {error && (
            <span className="text-xs text-rose-400 flex items-center gap-1.5 pl-4 animate-in fade-in slide-in-from-top-1">
              <AlertTriangle size={12} /> {error}
            </span>
          )}
          {success && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 pl-4 animate-in fade-in slide-in-from-top-1">
              <ShieldCheck size={12} /> {success}
            </span>
          )}
        </div>
      </div>

      {/* Grid of Domains (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-3xl bg-white/5 animate-pulse"
            />
          ))
        ) : origins.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-stone-600 border border-dashed border-white/10 rounded-3xl">
            <Globe size={32} className="mb-3 opacity-50" />
            <p className="text-sm">No domains authorized yet.</p>
          </div>
        ) : (
          origins.map((origin) => (
            <div
              key={origin}
              className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 backdrop-blur-md rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-white/10 text-white rounded-xl">
                  <ShieldCheck size={18} />
                </div>
                <button
                  onClick={() => handleRemove(origin)}
                  className="p-2 -mr-2 -mt-2 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="text-white/30" size={16} />
                </button>
              </div>

              <div>
                <div className="text-xs text-stone-500 font-medium mb-1 uppercase tracking-wider">
                  Origin
                </div>
                <div
                  className="font-mono text-sm text-white/90 truncate"
                  title={origin}
                >
                  {origin}
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
