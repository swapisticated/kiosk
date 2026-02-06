"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Trash2, Plus, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  title: string;
  type: "url" | "file";
  status: "active" | "error";
  date: string;
}

interface ManageSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  onAddSource: (url: string) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
}

export function ManageSourcesModal({
  isOpen,
  onClose,
  sources,
  onAddSource,
  onDeleteSource,
}: ManageSourcesModalProps) {
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setLoading(true);
    try {
      await onAddSource(newUrl);
      setNewUrl("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-stone-900 dark:bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Manage Sources
                  </h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Add content for your AI to learn from.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-stone-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Add Source Form */}
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
                      <Globe size={16} />
                    </div>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newUrl}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={16} />
                        Add
                      </>
                    )}
                  </button>
                </form>

                {/* Sources List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Active Sources ({sources.length})
                  </h3>

                  {sources.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl">
                      <p className="text-stone-500 text-sm">
                        No sources yet. Add one above.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sources.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-black/20 rounded-lg text-stone-400">
                              {s.type === "url" ? (
                                <Globe size={14} />
                              ) : (
                                <FileText size={14} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-stone-200 truncate">
                                {s.title || s.id}
                              </p>
                              <p className="text-xs text-stone-500">{s.date}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteSource(s.id)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-400 text-stone-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
