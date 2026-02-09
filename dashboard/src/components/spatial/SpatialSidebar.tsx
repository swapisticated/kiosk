"use client";

import { cn } from "@/lib/utils";
import { SidebarItem } from "./ui/SidebarItem";
import {
  Sparkles,
  FolderOpen,
  Users,
  Star,
  Upload,
  Bell,
  Settings,
  MessageSquare,
  MessageCircle,
  MessageCircleCodeIcon,
  Home,
  LucideHome,
  CirclePile,
  ChevronsLeftRight,
  CircleSlash2,
  CircleSlash2Icon,
  CircleSlash,
  MessageCircleMore,
  Bot,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SpatialSidebarProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
  workspaceName?: string;
  className?: string;
}

const NAV_ITEMS = [
  { id: "agents", icon: LucideHome, label: "Home" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "support", icon: MessageCircleCodeIcon, label: "Connect" },

  { id: "members", icon: Users, label: "Members" },
  { id: "starred", icon: Star, label: "Starred" },
  { id: "uploads", icon: Upload, label: "Uploads" },
  { id: "notifications", icon: Bell, label: "Alerts" },
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
        <div className="w-10 h-10 rounded-xl  flex items-center justify-center">
          <CirclePile size={28} className="text-white" />
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

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-white/40 hover:text-red-400 rounded-lg transition-all group"
        >
          <LogOut
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
