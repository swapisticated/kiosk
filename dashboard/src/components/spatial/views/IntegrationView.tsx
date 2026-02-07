"use client";

import { cn } from "@/lib/utils";
import { Code2, Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";

interface IntegrationViewProps {
  tenantId: string | null;
  apiUrl: string;
}

export function IntegrationView({ tenantId, apiUrl }: IntegrationViewProps) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"html" | "react">("html");

  const embedCode = useMemo(() => {
    if (!tenantId) return "Loading...";

    if (mode === "react") {
      return `import Script from 'next/script'

// Add this to your layout or page:
<>
  <Script id="kiosk-config">
    {\`window.KioskSettings = { tenantId: "${tenantId}" };\`}
  </Script>
  <Script 
    src="${apiUrl}/widget.js" 
    strategy="afterInteractive" 
  />
</>`;
    }

    return `<!-- Kiosk AI Chatbot -->
<script>
(function() {
  window.KioskSettings = {
    tenantId: "${tenantId}"
  };
  var s = document.createElement("script");
  s.src = "${apiUrl}/widget.js";
  s.async = true;
  var h = document.getElementsByTagName("head")[0];
  h.appendChild(s);
})();
</script>`;
  }, [tenantId, apiUrl, mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="text-stone-400" />
            <h3 className="font-bold text-xl text-white">Integration</h3>
          </div>
          <p className="text-stone-400 text-sm">
            {mode === "html"
              ? "Paste right before the </body> tag."
              : "Use next/script in your layout logic."}
          </p>
        </div>

        <div className="bg-white/10 p-1 rounded-lg flex gap-1">
          <button
            onClick={() => setMode("html")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-bold transition-all",
              mode === "html"
                ? "bg-white text-black shadow"
                : "text-stone-400 hover:text-white"
            )}
          >
            HTML
          </button>
          <button
            onClick={() => setMode("react")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-bold transition-all",
              mode === "react"
                ? "bg-white text-black shadow"
                : "text-stone-400 hover:text-white"
            )}
          >
            React
          </button>
        </div>
      </div>

      <div className="w-full flex-1 bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex gap-4 items-start relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <pre className="flex-1 overflow-x-auto text-sm font-mono text-stone-300 scrollbar-hide">
          {embedCode}
        </pre>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white flex-shrink-0"
        >
          {copied ? (
            <Check size={18} className="text-emerald-400" />
          ) : (
            <Copy size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
