"use client";

import { useState } from "react";
import { ingestUrl, type IngestResult } from "@/lib/api";

export default function DataPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<IngestResult[]>([]);

  const handleIngest = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const apiKey = localStorage.getItem("apiKey");
      if (!apiKey) {
        setError("No API key found. Please complete onboarding first.");
        return;
      }

      const result = await ingestUrl(apiKey, { url });
      setResults((prev) => [result, ...prev]);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ingest URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
        <p className="text-muted-foreground text-lg">
          Add more content for your chatbot to learn from
        </p>
      </header>

      {/* Add URL Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Add a webpage</h2>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="https://example.com/page"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleIngest()}
          />
          <button
            onClick={handleIngest}
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              "Ingest"
            )}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Ingestion Jobs</h2>
          {results.map((result, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{result.message}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Document ID:{" "}
                    <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">
                      {result.documentId}
                    </code>
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    result.status === "pending"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      : result.status === "processing"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : result.status === "processed"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  }`}
                >
                  {result.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
