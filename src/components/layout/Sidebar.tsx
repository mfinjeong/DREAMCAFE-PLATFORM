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
    <aside className="w-52 bg-[#111317] border-r border-[#22252A] flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-12 flex items-center px-4 border-b border-[#22252A]">
        <span className="text-xs font-bold tracking-widest text-[#EDEDEE] uppercase font-mono">
          DREAM<span className="text-[#B4232A]">CAFE</span>
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
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-xs transition-colors duration-75 ${
                isActive
                  ? "bg-[#1E1214] text-[#EDEDEE] font-medium border-l-2 border-[#B4232A]"
                  : "text-[#8A909A] hover:text-[#EDEDEE] hover:bg-[#15171A]"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-[#B4232A]" : "text-[#585C66]"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings at the bottom */}
      <div className="p-2 border-t border-[#22252A]">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-xs transition-colors duration-75 ${
            pathname === "/settings"
              ? "bg-[#1E1214] text-[#EDEDEE] font-medium border-l-2 border-[#B4232A]"
              : "text-[#8A909A] hover:text-[#EDEDEE] hover:bg-[#15171A]"
          }`}
        >
          <Settings
            className={`w-3.5 h-3.5 shrink-0 ${
              pathname === "/settings" ? "text-[#B4232A]" : "text-[#585C66]"
            }`}
          />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};
