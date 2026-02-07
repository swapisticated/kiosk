"use client";

import {
  FileText,
  Globe,
  Filter,
  Share2,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { ListRow } from "../ui/ListRow";
import { useState } from "react";

interface KnowledgeGridProps {
  docs: any[];
  onAddSource: () => void;
  onDeleteSource?: (id: string) => void;
}

export function KnowledgeGrid({
  docs,
  onAddSource,
  onDeleteSource,
}: KnowledgeGridProps) {
  // Transform docs for ListRow
  const items = docs.map((d) => ({
    id: d.id,
    name: d.title || d.url || "Untitled Document",
    date: new Date(d.updatedAt).toLocaleDateString(),
    size: d.sourceType === "scraped" ? "URL" : "File", // Meta mapped to type
    icon: d.sourceType === "scraped" ? Globe : FileText,
    iconColor:
      d.sourceType === "scraped"
        ? "bg-purple-500/20 text-purple-400"
        : "bg-blue-500/20 text-blue-400",
    status:
      d.status === "processed"
        ? ("success" as const)
        : d.status === "failed" || d.status === "error"
        ? ("error" as const)
        : ("pending" as const),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-base font-semibold text-white">Knowledge Base</h2>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2 text-xs">
            <Filter size={14} /> Filter
          </button>
          <button className="btn-secondary flex items-center gap-2 text-xs">
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={onAddSource}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-4"
          >
            <Plus size={14} /> Add Source
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-2 no-scrollbar">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="group relative">
              <ListRow
                icon={item.icon}
                iconColor={item.iconColor}
                name={item.name}
                date={item.date}
                meta={item.size}
                status={item.status}
              />
              {onDeleteSource && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSource(item.id);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-red-500/20 text-stone-500 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div
            className="flex flex-col items-center justify-center h-48 border border-dashed border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={onAddSource}
          >
            <div className="p-3 bg-white/5 rounded-full mb-3 text-stone-400">
              <Plus size={24} />
            </div>
            <p className="text-stone-300 font-medium text-sm">
              No sources active
            </p>
            <p className="text-stone-500 text-xs mt-1">
              Add a URL or file to train your agent
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
