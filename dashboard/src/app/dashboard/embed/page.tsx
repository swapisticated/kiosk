"use client";

import { useEffect, useState } from "react";

export default function EmbedPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTenantId(localStorage.getItem("tenantId"));
  }, []);

  const embedCodeHTML = tenantId
    ? `<!-- Kiosk AI Chatbot -->
<script>
(function(){
  window.KioskSettings = { 
    tenantId: "${tenantId}",
    apiUrl: "http://localhost:8000"
  };
  var w = document.createElement("script");
  w.src = "http://localhost:8000/widget.js";
  w.async = true;
  document.head.appendChild(w);
})();
</script>`
    : "";

  const embedCodeNext = tenantId
    ? `<Script id="kiosk-widget" strategy="afterInteractive" dangerouslySetInnerHTML={{
  __html: \`
    (function(){
      window.KioskSettings = { 
        tenantId: "${tenantId}",
        apiUrl: "http://localhost:8000"
      };
      var w = document.createElement("script");
      w.src = "http://localhost:8000/widget.js";
      w.async = true;
      document.head.appendChild(w);
    })();
  \`
}} />`
    : "";

  const [activeTab, setActiveTab] = useState<"html" | "next">("html");
  const displayCode = activeTab === "html" ? embedCodeHTML : embedCodeNext;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Embed Code</h1>
        <p className="text-muted-foreground text-lg">
          Add the chatbot widget to your website
        </p>
      </header>

      {/* Embed Code Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("html")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "html"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              HTML
            </button>
            <button
              onClick={() => setActiveTab("next")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "next"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Next.js
            </button>
          </div>
          <button
            onClick={() => copyToClipboard(displayCode)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              copied
                ? "bg-green-500 text-white"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {copied ? "✓ Copied!" : "Copy Code"}
          </button>
        </div>

        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-sm">
          <code>{displayCode}</code>
        </pre>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
            Installation Instructions
          </h3>
          <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-2 list-decimal list-inside">
            <li>Copy the code above</li>
            <li>
              Paste it just before the closing <code>&lt;/body&gt;</code> tag
            </li>
            <li>Save and deploy your website</li>
            <li>The chat widget will appear in the bottom-right corner</li>
          </ol>
        </div>
      </div>

      {/* Tenant ID Reference */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-2">Your Tenant ID</h2>
        <code className="block p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-mono">
          {tenantId || "Loading..."}
        </code>
        <p className="text-sm text-muted-foreground mt-2">
          Use this ID for API integrations
        </p>
      </div>
    </div>
  );
}
