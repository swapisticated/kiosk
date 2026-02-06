import { marked } from "marked";

interface KioskConfig {
  tenantId: string;
  theme?: "light" | "dark" | "system";
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  botName?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  apiUrl?: string;
  logoUrl?: string;
  chatBackground?: string;
  chatBackgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  incomingBubbleColor?: string;
  outgoingBubbleColor?: string;
  borderRadius?: number;
}

declare global {
  interface Window {
    KioskSettings?: KioskConfig;
    KioskWidget?: { init: (config: KioskConfig) => Promise<KioskChatWidget> };
  }
}

const DEFAULTS: Partial<KioskConfig> = {
  theme: "light",
  position: "bottom-right",
  primaryColor: "#2563eb",
  botName: "Assistant",
  welcomeMessage: "Hello! How can I help you today?",
  placeholderText: "Type a message...",
  apiUrl: "http://localhost:8000",
};
class KioskChatWidget {
  private config: KioskConfig;
  private container: HTMLDivElement;
  private shadow: ShadowRoot;
  private isOpen = false;
  private sessionId: string;

  constructor(config: KioskConfig) {
    this.config = { ...DEFAULTS, ...config } as KioskConfig;
    this.sessionId = this.getOrCreateSession();
    this.container = document.createElement("div");
    this.shadow = this.container.attachShadow({ mode: "open" });
    document.body.appendChild(this.container);
    this.render();
    this.addStyles();
    this.setupEvents();
  }

  private getOrCreateSession(): string {
    const KEY = `kiosk_session_${this.config.tenantId}`;
    let sid = localStorage.getItem(KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(KEY, sid);
    }
    return sid;
  }

  private render() {
    const pos =
      this.config.position === "bottom-left" ? "left: 20px;" : "right: 20px;";

    const logoHtml = this.config.logoUrl
      ? `<img src="${this.config.logoUrl}" class="bot-logo" />`
      : `<div class="bot-icon">AI</div>`;

    this.shadow.innerHTML = `
      <div class="widget" style="${pos}">
        <div class="window hidden">
          <div class="header">
            <div class="header-info">
              ${logoHtml}
              <span>${this.config.botName}</span>
            </div>
            <button class="close">✕</button>
          </div>
          <div class="messages">
            <div class="msg bot">${this.config.welcomeMessage}</div>
          </div>
          <div class="input-area">
            <div class="input-wrapper">
              <input type="text" placeholder="${this.config.placeholderText}" />
              <button class="send">➤</button>
            </div>
            <div class="attribution">Powered by Kiosk</div>
          </div>
        </div>
        <button class="toggle">💬</button>
      </div>
    `;
  }

  private addStyles() {
    const isDark =
      this.config.theme === "dark" ||
      (this.config.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const primary = this.config.primaryColor;
    const incomingBg =
      this.config.incomingBubbleColor || (isDark ? "#262626" : "#fff");
    const outgoingBg = this.config.outgoingBubbleColor || primary;

    let bgStyle = isDark ? "#0d0d0d" : "#f9fafb";
    let bgSize = "cover";
    let bgRepeat = "no-repeat";

    if (this.config.chatBackground) {
      const bg = this.config.chatBackground;
      bgStyle = bg.includes("(") ? bg : `url(${bg})`;

      // If it's a known pattern or the user explicitly chose pattern style
      if (
        bg.includes("pattern") ||
        this.config.chatBackgroundStyle === "pattern"
      ) {
        bgSize = "auto";
        bgRepeat = "repeat";
      }
    }

    const style = document.createElement("style");
    style.textContent = `
      .widget {
        box-sizing: border-box;
        position: fixed;
        bottom: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        cursor: default;
      }
      .toggle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${primary};
        color: #fff;
        border: none;
        cursor: pointer;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s;
      }
      .toggle:hover { transform: scale(1.05); }
      .window {
        position: absolute;
        bottom: 70px;
        ${this.config.position === "bottom-left" ? "left: 0;" : "right: 0;"}
        width: 360px;
        height: 480px;
        background: ${isDark ? "#1a1a1a" : "#fff"};
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid ${isDark ? "#333" : "#e5e7eb"};
      }
      .window.hidden { display: none; }
      .header {
        background: ${primary};
        color: #fff;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }
      .header-info { display: flex; align-items: center; gap: 10px; }
      .bot-logo { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.2); }
      .bot-icon { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 10px; }
      .close {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        font-size: 16px;
        opacity: 0.8;
      }
      .close:hover { opacity: 1; }
      .messages {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: ${bgStyle};
        background-size: ${bgSize};
        background-repeat: ${bgRepeat};
        background-position: center;
      }
      .msg {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
        animation: fadeIn 0.2s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .msg.bot {
        background: ${incomingBg};
        color: ${isDark ? "#e5e5e5" : "#1f2937"};
        align-self: flex-start;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      .msg.user {
        background: ${outgoingBg};
        color: #fff;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      .msg.typing { color: ${isDark ? "#888" : "#666"}; font-style: italic; }
      .input-area {
        padding: 12px;
        background: ${isDark ? "#1a1a1a" : "#fff"};
        border-top: 1px solid ${isDark ? "#333" : "#e5e7eb"};
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .input-wrapper {
        display: flex;
        gap: 8px;
        width: 100%;
      }
      .input-area input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid ${isDark ? "#333" : "#d1d5db"};
        border-radius: 20px;
        outline: none;
        font-size: 14px;
        background: ${isDark ? "#0d0d0d" : "#f9fafb"};
        color: ${isDark ? "#e5e5e5" : "#1f2937"};
      }
      .input-area input:focus { border-color: ${primary}; }
      .send {
        width: 40px;
        height: 40px;
        background: ${primary};
        color: #fff;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
      }
      .attribution {
        text-align: center;
        font-size: 10px;
        color: ${isDark ? "#666" : "#9ca3af"};
        margin-top: 4px;
      }
      .send:disabled { opacity: 0.5; cursor: not-allowed; }
      @media (max-width: 400px) {
        .window { width: calc(100vw - 40px); height: 65vh; }
      }
      
      /* Markdown Styles */
      .msg.bot p { margin: 0 0 8px 0; }
      .msg.bot p:last-child { margin-bottom: 0; }
      .msg.bot ul, .msg.bot ol { margin: 8px 0; padding-left: 20px; }
      .msg.bot li { margin-bottom: 4px; }
      .msg.bot a { color: inherit; text-decoration: underline; }
      .msg.bot code { background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
      .msg.bot pre { background: rgba(0,0,0,0.1); padding: 8px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }
      .msg.bot pre code { background: none; padding: 0; }
      .msg.bot h1, .msg.bot h2, .msg.bot h3 { margin: 8px 0 4px 0; font-size: 1.1em; }
      .msg.bot strong { font-weight: 700; }
      .msg.bot em { font-style: italic; }
    `;
    this.shadow.appendChild(style);
  }

  private setupEvents() {
    const toggle = this.shadow.querySelector(".toggle") as HTMLElement;
    const close = this.shadow.querySelector(".close") as HTMLElement;
    const send = this.shadow.querySelector(".send") as HTMLButtonElement;
    const input = this.shadow.querySelector("input") as HTMLInputElement;
    const window = this.shadow.querySelector(".window") as HTMLElement;

    toggle.onclick = () => {
      this.isOpen = !this.isOpen;
      window.classList.toggle("hidden", !this.isOpen);
      toggle.textContent = this.isOpen ? "✕" : "💬";
      if (this.isOpen) input.focus();
    };

    close.onclick = () => {
      this.isOpen = false;
      window.classList.add("hidden");
      toggle.textContent = "💬";
    };

    const sendMsg = async () => {
      const text = input.value.trim();
      if (!text) return;
      this.addMessage(text, "user");
      input.value = "";
      send.disabled = true;
      await this.fetchResponse(text);
      send.disabled = false;
    };

    send.onclick = sendMsg;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMsg();
      }
    });
  }

  private addMessage(text: string, role: "user" | "bot" | "typing") {
    const messages = this.shadow.querySelector(".messages")!;
    const el = document.createElement("div");
    el.className = `msg ${role}`;

    if (role === "bot") {
      el.innerHTML = marked.parse(text) as string;
    } else {
      el.textContent = text;
    }

    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  private async fetchResponse(text: string) {
    const typing = this.addMessage("Thinking...", "typing");
    try {
      const res = await fetch(`${this.config.apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: this.config.tenantId,
          message: text,
          sessionId: this.sessionId,
        }),
      });
      typing.remove();
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      this.addMessage(data.answer, "bot");
    } catch {
      typing.remove();
      this.addMessage("Sorry, something went wrong.", "bot");
    }
  }
}

(async function () {
  const init = async (cfg: KioskConfig): Promise<KioskChatWidget> => {
    const fullConfig = { ...DEFAULTS, ...cfg };
    try {
      const res = await fetch(
        `${fullConfig.apiUrl}/tenants/${fullConfig.tenantId}/config`
      );
      if (res.ok) {
        const data = await res.json();
        // Merge remote config (e.g. primaryColor, botName, logoUrl, etc.)
        if (data.config) {
          Object.assign(fullConfig, data.config);
        }
      }
    } catch (e) {
      console.error("Kiosk: Failed to load remote config", e);
    }
    return new KioskChatWidget(fullConfig as KioskConfig);
  };

  const settings = window.KioskSettings;
  if (settings?.tenantId) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => init(settings));
    } else {
      init(settings);
    }
  }

  window.KioskWidget = { init };
})();
