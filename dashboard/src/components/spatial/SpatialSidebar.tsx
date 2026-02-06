"use client";

import { cn } from "@/lib/utils";
import { SidebarItem } from "./ui/SidebarItem";
import {
  LayoutGrid,
  FolderOpen,
  Users,
  Star,
  Upload,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";

interface SpatialSidebarProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
  workspaceName?: string;
  className?: string;
}

const NAV_ITEMS = [
  { id: "files", icon: FolderOpen, label: "Agents" },
  { id: "members", icon: Users, label: "Members" },
  { id: "starred", icon: Star, label: "Starred" },
  { id: "uploads", icon: Upload, label: "Uploads" },
  { id: "notifications", icon: Bell, label: "Alerts" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "support", icon: HelpCircle, label: "Support" },
];

export function SpatialSidebar({
  activeItem = "files",
  onItemClick,
  workspaceName = "Kiosk",
  className,
}: SpatialSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col w-[200px] h-full py-6 px-4",
        "border-r border-white/[0.06]",
        className
      )}
    >
      {/* Workspace Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-teal flex items-center justify-center">
          <LayoutGrid size={20} className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">
            {workspaceName}
          </span>
          <span className="text-xs text-white/40">Workspace</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
            onClick={() => onItemClick?.(item.id)}
          />
        ))}
      </nav>
    </aside>
  );
}
