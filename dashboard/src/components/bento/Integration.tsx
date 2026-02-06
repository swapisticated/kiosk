import { cn } from "@/lib/utils";
import { Code2, Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";

interface IntegrationProps {
  tenantId: string | null;
  apiUrl: string;
  className?: string;
  colSpan?: number;
}

export function Integration({
  tenantId,
  apiUrl,
  className,
  colSpan = 4,
}: IntegrationProps) {
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
    <div
      className={cn(
        "rounded-[2rem] bg-stone-900 dark:bg-card backdrop-blur-xl text-white p-8 shadow-soft relative overflow-hidden group border border-transparent dark:border-white/10 h-full flex flex-col justify-between",
        colSpan === 4
          ? "col-span-1 md:col-span-2 lg:col-span-4"
          : `col-span-${colSpan}`,
        className
      )}
    >
      <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 flex flex-col gap-6 h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Code2 className="text-stone-400" />
              <h3 className="font-bold text-xl">Integration</h3>
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

        <div className="w-full flex-1 bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex gap-4 items-center min-h-[80px]">
          <pre className="flex-1 overflow-x-auto text-xs font-mono text-stone-300 scrollbar-none">
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
    </div>
  );
}
