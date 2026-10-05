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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "PC", href: "/pc", icon: Monitor },
  { label: "Console", href: "/consoles", icon: Gamepad2 },
  { label: "Sessions", href: "/sessions", icon: Clock },
  { label: "Booking", href: "/booking", icon: CalendarDays },
  { label: "Store", href: "/store", icon: ShoppingBag },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Tournament", href: "/tournaments", icon: Trophy },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-52 bg-[#0e1015] border-r border-[#1e212b] flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-12 flex items-center px-4 border-b border-[#1e212b]">
        <span className="text-xs font-bold tracking-widest text-zinc-100 uppercase font-mono">
          DREAM<span className="text-[#b91c1c]">CAFE</span>
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-2.5 space-y-0.5 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] text-xs transition-colors duration-75 ${
                isActive
                  ? "bg-[#1d1316] text-white font-medium border-l-2 border-[#b91c1c]"
                  : "text-[#8a8f9d] hover:text-zinc-200 hover:bg-[#151720]"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-[#f87171]" : "text-[#717684]"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings at the bottom */}
      <div className="p-2 border-t border-[#1e212b]">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] text-xs transition-colors duration-75 ${
            pathname === "/settings"
              ? "bg-[#1d1316] text-white font-medium border-l-2 border-[#b91c1c]"
              : "text-[#8a8f9d] hover:text-zinc-200 hover:bg-[#151720]"
          }`}
        >
          <Settings
            className={`w-3.5 h-3.5 shrink-0 ${
              pathname === "/settings" ? "text-[#f87171]" : "text-[#717684]"
            }`}
          />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};
