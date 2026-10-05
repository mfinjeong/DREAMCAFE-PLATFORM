"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  Gamepad2,
  Clock,
  CalendarDays,
  ShoppingBag,
  Package,
  Trophy,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "PC", href: "/pc", icon: Monitor },
  { label: "Console", href: "/consoles", icon: Gamepad2 },
  { label: "Sessions", href: "/sessions", icon: Clock },
  { label: "Booking", href: "/booking", icon: CalendarDays },
  { label: "Store", href: "/store", icon: ShoppingBag },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Members", href: "/members", icon: Users },
  { label: "Tournament", href: "/tournaments", icon: Trophy },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#0c0d12] border-r border-[#1a1d26] flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header: Simple, compact, no giant logo */}
      <div className="h-12 flex items-center px-4 border-b border-[#1a1d26] gap-2">
        <span className="w-2 h-2 rounded-sm bg-red-600 shrink-0"></span>
        <span className="text-xs font-bold tracking-widest text-zinc-100 uppercase">
          DREAM<span className="text-zinc-400">CAFE</span>
        </span>
      </div>

      {/* Compact Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
                isActive
                  ? "bg-[#181a24] text-white font-medium border-l-2 border-red-600"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#13151d]"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-red-500" : "text-zinc-500"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Compact Footer */}
      <div className="px-3 py-2.5 border-t border-[#1a1d26] bg-[#0a0a0e] text-[11px] text-zinc-500 flex items-center justify-between font-mono">
        <span>ONLINE</span>
        <span>v1.0</span>
      </div>
    </aside>
  );
};
