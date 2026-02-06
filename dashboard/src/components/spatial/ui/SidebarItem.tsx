"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  className,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "sidebar-item w-full",
        active && "sidebar-item-active",
        className
      )}
    >
      <Icon size={20} className={active ? "text-white" : undefined} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
