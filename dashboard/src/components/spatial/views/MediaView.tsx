"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MoreHorizontal,
  MessageSquare,
  User,
  Clock,
  ChevronRight,
  Bot,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MediaViewProps {
  stats: any; // Fallback stats if needed
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function MediaView({ stats }: MediaViewProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const tenantId =
    typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
  const apiKey =
    typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;

  // Fetch conversations list
  useEffect(() => {
    if (!tenantId) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch(
          `${API_URL}/conversations?limit=50&tenantId=${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [tenantId, apiKey]);

  // Fetch specific conversation details
  useEffect(() => {
    if (!selectedId || !tenantId) return;

    const fetchDetails = async () => {
      setLoadingMsgs(true);
      try {
        const res = await fetch(
          `${API_URL}/conversations/${selectedId}?tenantId=${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        setLoadingMsgs(false);
      }
    };

    fetchDetails();
  }, [selectedId, tenantId, apiKey]);

  const filteredConversations = conversations.filter(
    (c) =>
      c.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden p-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Conversations
          </h2>
          <p className="text-stone-400 text-sm">
            Detailed history and insights
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Left Panel: List */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "flex-1 flex flex-col min-h-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300",
            selectedId ? "hidden md:flex md:w-1/3 md:flex-none" : "w-full"
          )}
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-white/5">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-white transition-colors"
                size={14}
              />
              <input
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:bg-white/10 focus:border-white/20 outline-none transition-all placeholder:text-stone-600"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-stone-500 gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-xs">Loading chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-stone-600 text-sm">
                No conversations found
              </div>
            ) : (
              filteredConversations.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedId(chat.id)}
                  className={cn(
                    "group p-3 rounded-xl border border-transparent hover:bg-white/5 cursor-pointer transition-all",
                    selectedId === chat.id ? "bg-white/10 border-white/10" : ""
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <span className="text-xs font-mono text-stone-400 truncate max-w-[120px]">
                        {chat.sessionId.slice(0, 8)}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-600">
                      {new Date(chat.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-white/90 font-medium truncate mb-1">
                    {chat.query}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(chat.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={10} />
                      {chat.messageCount} msgs
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Right Panel: Details */}
        <AnimatePresence mode="wait">
          {selectedId && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                "flex-[2] flex flex-col min-h-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden",
                !selectedId ? "hidden md:flex" : "flex"
              )}
            >
              {/* Chat Header */}
              <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="md:hidden p-2 -ml-2 text-stone-400 hover:text-white"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
                    <img
                      src={selectedConversation?.avatar}
                      className="w-full h-full rounded-full bg-black"
                      alt="User"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Visitor {selectedConversation?.sessionId.slice(0, 6)}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(
                          selectedConversation?.createdAt
                        ).toLocaleString()}
                      </span>
                      {selectedConversation?.visitorInfo?.ip && (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">
                          {selectedConversation.visitorInfo.ip}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Complete
                  </div>
                  <button className="p-2 text-stone-500 hover:text-white transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-black/20">
                {loadingMsgs ? (
                  <div className="flex flex-col items-center justify-center h-full text-stone-500 gap-3">
                    <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-sm">Loading transcript...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-stone-500">
                    <p>No messages recorded</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id}
                      className={cn(
                        "flex gap-4 max-w-3xl",
                        msg.role === "user" ? "flex-row-reverse ml-auto" : ""
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-lg border border-white/5",
                          msg.role === "assistant"
                            ? "bg-gradient-to-br from-cyan-500 to-blue-500"
                            : "bg-stone-700"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <Bot size={14} className="text-white" />
                        ) : (
                          <User size={14} className="text-stone-300" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={cn(
                          "flex flex-col gap-1 min-w-0 max-w-[80%]",
                          msg.role === "user" ? "items-end" : "items-start"
                        )}
                      >
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] text-stone-500 font-medium">
                            {msg.role === "assistant" ? "AI Agent" : "Visitor"}
                          </span>
                          <span className="text-[10px] text-stone-600">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm border",
                            msg.role === "user"
                              ? "bg-white/10 text-white rounded-tr-sm border-white/5"
                              : "bg-indigo-500/10 text-indigo-100 rounded-tl-sm border-indigo-500/10"
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {!selectedId && (
            <div className="hidden md:flex flex-[2] flex-col items-center justify-center bg-black/20 rounded-2xl border border-white/5 text-stone-500 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <MessageSquare size={32} className="opacity-20" />
              </div>
              <p className="text-sm">Select a conversation to view details</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
