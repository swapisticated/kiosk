"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Palette,
  LayoutGrid,
  Settings,
  Code,
  LogOut,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "#home" },
  { icon: LayoutGrid, label: "Data", href: "#data" },
  { icon: Palette, label: "Customize", href: "#customize" },
  { icon: Code, label: "Embed", href: "#embed" },
];

export function SidebarDock() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-8 py-8 px-4 bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-transparent dark:border-white/10 rounded-full shadow-soft h-fit min-h-[500px]">
      {/* Brand Icon */}
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
        K
      </div>

      {/* Nav Items */}
      <div className="flex flex-col gap-4 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-3 rounded-full transition-all duration-300 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg scale-110"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />

              {/* Tooltip */}
              <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm whitespace-nowrap z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-4 mt-auto pt-4 border-t border-border/50">
        <button className="p-3 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <User size={22} />
        </button>
      </div>
    </nav>
  );
}
