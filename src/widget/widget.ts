import { marked } from "marked";

interface KioskConfig {
  tenantId: string;
  // General
  theme?: "light" | "dark" | "system";
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  botName?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  apiUrl?: string;
  logoUrl?: string;
  // Branding
  fontFamily?: string;
  headerStyle?: "solid" | "gradient" | "minimal";
  // Interface
  borderRadius?: number;
  widgetSize?: "compact" | "default" | "large";
  launcherIcon?: "chat" | "support" | "robot" | "wave";
  launcherSize?: number;
  windowWidth?: number;
  windowHeight?: number;
  // Chat Theme
  chatBackground?: string;
  chatBackgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  incomingBubbleColor?: string;
  outgoingBubbleColor?: string;
  incomingTextColor?: string;
  outgoingTextColor?: string;
  bubbleStyle?: "rounded" | "sharp" | "pill";
  showTimestamps?: boolean;
  typingIndicator?: "dots" | "text" | "pulse";
  // Behavior
  autoOpen?: boolean;
  autoOpenDelay?: number;
  soundEnabled?: boolean;
  persistChat?: boolean;
}

declare global {
  interface Window {
    KioskSettings?: KioskConfig;
    KioskWidget?: { init: (config: KioskConfig) => Promise<KioskChatWidget> };
  }
  var __API_URL__: string;
}

const DEFAULTS: Partial<KioskConfig> = {
  theme: "light",
  position: "bottom-right",
  primaryColor: "#2563eb",
  botName: "Assistant",
  welcomeMessage: "Hello! How can I help you today?",
  placeholderText: "Type a message...",
  apiUrl: __API_URL__,
  borderRadius: 12,
  launcherSize: 56,
  windowWidth: 360,
  windowHeight: 480,
  bubbleStyle: "rounded",
  typingIndicator: "dots",
  headerStyle: "solid",
  launcherIcon: "chat",
};

const LAUNCHER_ICONS: Record<string, string> = {
  chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  support: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  robot: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/></svg>`,
  wave: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.5 12.5c0 .83-.67 1.5-1.5 1.5H7c-2.76 0-5-2.24-5-5s2.24-5 5-5c.71 0 1.39.15 2 .42"/><path d="M20 4s-2 2.17-2 4c0 1.1.9 2 2 2s2-.9 2-2c0-1.83-2-4-2-4z"/><path d="M15.66 3.34l.59.59a2 2 0 0 1 0 2.83l-1.74 1.74"/></svg>`,
};

function getLauncherIcon(key?: string): string {
  return LAUNCHER_ICONS[key || "chat"] ?? LAUNCHER_ICONS.chat!;
}

class KioskChatWidget {
  private config: KioskConfig;
  private container: HTMLDivElement;
  private shadow: ShadowRoot;
  private isOpen = false;
  private sessionId: string;
  private messages: { text: string; role: "user" | "bot"; time: Date }[] = [];

  constructor(config: KioskConfig) {
    this.config = { ...DEFAULTS, ...config } as KioskConfig;
    this.sessionId = this.getOrCreateSession();
    this.container = document.createElement("div");
    this.shadow = this.container.attachShadow({ mode: "open" });
    document.body.appendChild(this.container);

    // Load persisted messages
    if (this.config.persistChat) {
      this.loadPersistedMessages();
    }

    this.render();
    this.addStyles();
    this.setupEvents();

    // Auto-open
    if (this.config.autoOpen) {
      const delay = (this.config.autoOpenDelay ?? 3) * 1000;
      setTimeout(() => {
        if (!this.isOpen) {
          this.toggleOpen();
        }
      }, delay);
    }
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

  private loadPersistedMessages() {
    try {
      const KEY = `kiosk_history_${this.config.tenantId}`;
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.messages = parsed.map((m: any) => ({
          ...m,
          time: new Date(m.time),
        }));
      }
    } catch {
      // ignore
    }
  }

  private persistMessages() {
    if (!this.config.persistChat) return;
    try {
      const KEY = `kiosk_history_${this.config.tenantId}`;
      localStorage.setItem(KEY, JSON.stringify(this.messages));
    } catch {
      // ignore
    }
  }

  private getWindowDimensions() {
    const size = this.config.widgetSize || "default";
    let w = this.config.windowWidth ?? 360;
    let h = this.config.windowHeight ?? 480;

    if (size === "compact") {
      w = Math.min(w, 340);
      h = Math.min(h, 420);
    } else if (size === "large") {
      w = Math.max(w, 400);
      h = Math.max(h, 540);
    }

    return { w, h };
  }

  private getBubbleRadius() {
    const style = this.config.bubbleStyle || "rounded";
    switch (style) {
      case "sharp":
        return "4px";
      case "pill":
        return "20px";
      default:
        return "12px";
    }
  }

  private getBubbleCornerOverride(role: "user" | "bot") {
    const style = this.config.bubbleStyle || "rounded";
    if (style === "pill") return "";
    const corner =
      role === "bot"
        ? "border-bottom-left-radius"
        : "border-bottom-right-radius";
    return `${corner}: ${style === "sharp" ? "0px" : "4px"};`;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  private getTypingHtml(): string {
    const style = this.config.typingIndicator || "dots";
    switch (style) {
      case "text":
        return "Thinking...";
      case "pulse":
        return `<span class="typing-pulse"></span>`;
      default:
        return `<span class="typing-dots"><span></span><span></span><span></span></span>`;
    }
  }

  private render() {
    const pos =
      this.config.position === "bottom-left" ? "left: 20px;" : "right: 20px;";
    const launcherSize = this.config.launcherSize ?? 56;
    const iconKey = this.config.launcherIcon || "chat";
    const iconSvg = LAUNCHER_ICONS[iconKey] || LAUNCHER_ICONS.chat;

    const logoHtml = this.config.logoUrl
      ? `<img src="${this.config.logoUrl}" class="bot-logo" />`
      : `<div class="bot-icon">AI</div>`;

    // Build persisted messages HTML
    let messagesHtml = "";
    if (this.messages.length > 0) {
      messagesHtml = this.messages
        .map((m) => {
          const content =
            m.role === "bot" ? (marked.parse(m.text) as string) : m.text;
          const timestamp = this.config.showTimestamps
            ? `<span class="msg-time">${this.formatTime(m.time)}</span>`
            : "";
          return `<div class="msg ${m.role}">${content}${timestamp}</div>`;
        })
        .join("");
    } else {
      const timestamp = this.config.showTimestamps
        ? `<span class="msg-time">${this.formatTime(new Date())}</span>`
        : "";
      messagesHtml = `<div class="msg bot">${this.config.welcomeMessage}${timestamp}</div>`;
      this.messages.push({
        text: this.config.welcomeMessage!,
        role: "bot",
        time: new Date(),
      });
    }

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
            ${messagesHtml}
          </div>
          <div class="input-area">
            <div class="input-wrapper">
              <input type="text" placeholder="${this.config.placeholderText}" />
              <button class="send">➤</button>
            </div>
            <div class="attribution">Powered by Kiosk</div>
          </div>
        </div>
        <button class="toggle" style="width:${launcherSize}px;height:${launcherSize}px;">${iconSvg}</button>
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
    const borderRadius = this.config.borderRadius ?? 12;
    const bubbleRadius = this.getBubbleRadius();
    const { w: winW, h: winH } = this.getWindowDimensions();
    const launcherSize = this.config.launcherSize ?? 56;
    const fontFamily =
      this.config.fontFamily ||
      `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    // Header style
    let headerBg = primary;
    let headerBorder = "none";
    if (this.config.headerStyle === "gradient") {
      headerBg = `linear-gradient(135deg, ${primary}, ${this.adjustColor(
        primary!,
        30
      )})`;
    } else if (this.config.headerStyle === "minimal") {
      headerBg = isDark ? "#1a1a1a" : "#fff";
      headerBorder = `1px solid ${isDark ? "#333" : "#e5e7eb"}`;
    }

    let bgStyle = isDark ? "#0d0d0d" : "#f9fafb";
    let bgSize = "cover";
    let bgRepeat = "no-repeat";

    if (this.config.chatBackground) {
      const bg = this.config.chatBackground;
      bgStyle = bg.includes("(") ? bg : `url(${bg})`;
      if (
        bg.includes("pattern") ||
        this.config.chatBackgroundStyle === "pattern"
      ) {
        bgSize = "auto";
        bgRepeat = "repeat";
      }
    }

    // Load Google Font if needed
    if (this.config.fontFamily && !this.config.fontFamily.includes("system")) {
      const fontName = this.config.fontFamily
        .split("'")
        .filter((s) => s.trim() && s.trim() !== ",")[0];
      if (fontName) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(
          / /g,
          "+"
        )}:wght@400;500;600;700&display=swap`;
        this.shadow.appendChild(link);
      }
    }

    const style = document.createElement("style");
    style.textContent = `
      .widget {
        box-sizing: border-box;
        position: fixed;
        bottom: 20px;
        z-index: 999999;
        font-family: ${fontFamily};
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        cursor: default;
      }
      *, *::before, *::after { box-sizing: border-box; }
      .toggle {
        width: ${launcherSize}px;
        height: ${launcherSize}px;
        border-radius: 50%;
        background: ${primary};
        color: #fff;
        border: none;
        cursor: pointer;
        font-size: 24px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .toggle:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
      .toggle svg { width: ${Math.round(
        launcherSize * 0.43
      )}px; height: ${Math.round(launcherSize * 0.43)}px; }
      .window {
        position: absolute;
        bottom: ${launcherSize + 14}px;
        ${this.config.position === "bottom-left" ? "left: 0;" : "right: 0;"}
        width: ${winW}px;
        height: ${winH}px;
        background: ${isDark ? "#1a1a1a" : "#fff"};
        border-radius: ${borderRadius}px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px ${
          isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
        };
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid ${isDark ? "#333" : "#e5e7eb"};
        animation: windowIn 0.25s ease-out;
      }
      @keyframes windowIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .window.hidden { display: none; }
      .header {
        background: ${headerBg};
        color: ${
          this.config.headerStyle === "minimal"
            ? isDark
              ? "#e5e5e5"
              : "#1f2937"
            : "#fff"
        };
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        ${headerBorder !== "none" ? `border-bottom: ${headerBorder};` : ""}
      }
      .header-info { display: flex; align-items: center; gap: 10px; }
      .bot-logo { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.2); }
      .bot-icon { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
      .close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 16px;
        opacity: 0.7;
        transition: opacity 0.15s;
      }
      .close:hover { opacity: 1; }
      .messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: ${bgStyle};
        background-size: ${bgSize};
        background-repeat: ${bgRepeat};
        background-position: center;
        scrollbar-width: thin;
        scrollbar-color: ${
          isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
        } transparent;
      }
      .messages::-webkit-scrollbar { width: 4px; }
      .messages::-webkit-scrollbar-thumb { background: ${
        isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
      }; border-radius: 4px; }
      .msg {
        max-width: 82%;
        padding: 10px 14px;
        border-radius: ${bubbleRadius};
        font-size: 14px;
        line-height: 1.5;
        animation: fadeIn 0.2s ease;
        position: relative;
      }
      .msg-time {
        display: block;
        font-size: 10px;
        opacity: 0.5;
        margin-top: 4px;
        font-weight: 400;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .msg.bot {
        background: ${incomingBg};
        color: ${
          this.config.incomingTextColor || (isDark ? "#e5e5e5" : "#1f2937")
        };
        align-self: flex-start;
        ${this.getBubbleCornerOverride("bot")}
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .msg.user {
        background: ${outgoingBg};
        color: ${this.config.outgoingTextColor || "#fff"};
        align-self: flex-end;
        ${this.getBubbleCornerOverride("user")}
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .msg.typing {
        color: ${isDark ? "#888" : "#666"};
        font-style: italic;
        background: ${incomingBg};
        align-self: flex-start;
        ${this.getBubbleCornerOverride("bot")}
      }

      /* Typing indicators */
      .typing-dots {
        display: inline-flex;
        gap: 4px;
        align-items: center;
        height: 20px;
      }
      .typing-dots span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.4;
        animation: dotPulse 1.4s infinite ease-in-out;
      }
      .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
      .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes dotPulse {
        0%, 80%, 100% { opacity: 0.4; transform: scale(1); }
        40% { opacity: 1; transform: scale(1.2); }
      }
      .typing-pulse {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: currentColor;
        animation: pulse 1s infinite ease-in-out;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }

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
        font-family: inherit;
        background: ${isDark ? "#0d0d0d" : "#f9fafb"};
        color: ${isDark ? "#e5e5e5" : "#1f2937"};
        transition: border-color 0.15s;
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
        transition: opacity 0.15s;
        flex-shrink: 0;
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

  private adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  private toggleOpen() {
    this.isOpen = !this.isOpen;
    const win = this.shadow.querySelector(".window") as HTMLElement;
    const toggle = this.shadow.querySelector(".toggle") as HTMLElement;
    win.classList.toggle("hidden", !this.isOpen);
    toggle.innerHTML = this.isOpen
      ? "✕"
      : getLauncherIcon(this.config.launcherIcon);
    if (this.isOpen) {
      const input = this.shadow.querySelector("input") as HTMLInputElement;
      input?.focus();
    }
  }

  private setupEvents() {
    const toggle = this.shadow.querySelector(".toggle") as HTMLElement;
    const close = this.shadow.querySelector(".close") as HTMLElement;
    const send = this.shadow.querySelector(".send") as HTMLButtonElement;
    const input = this.shadow.querySelector("input") as HTMLInputElement;

    toggle.onclick = () => this.toggleOpen();

    close.onclick = () => {
      this.isOpen = false;
      const win = this.shadow.querySelector(".window") as HTMLElement;
      win.classList.add("hidden");
      toggle.innerHTML = getLauncherIcon(this.config.launcherIcon);
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

    if (role === "typing") {
      el.innerHTML = this.getTypingHtml();
    } else if (role === "bot") {
      let html = marked.parse(text) as string;
      if (this.config.showTimestamps) {
        html += `<span class="msg-time">${this.formatTime(new Date())}</span>`;
      }
      el.innerHTML = html;
    } else {
      el.textContent = text;
      if (this.config.showTimestamps) {
        const timeSpan = document.createElement("span");
        timeSpan.className = "msg-time";
        timeSpan.textContent = this.formatTime(new Date());
        el.appendChild(timeSpan);
      }
    }

    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;

    // Track for persistence
    if (role !== "typing") {
      this.messages.push({ text, role, time: new Date() });
      this.persistMessages();
    }

    // Play sound on bot message
    if (role === "bot" && this.config.soundEnabled) {
      this.playNotificationSound();
    }

    return el;
  }

  private playNotificationSound() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }

  private async fetchResponse(text: string) {
    const typing = this.addMessage("", "typing");
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
