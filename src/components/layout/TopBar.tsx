"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, User } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/pc": "PC Management",
  "/consoles": "Console Stations",
  "/sessions": "Sessions",
  "/booking": "Booking",
  "/store": "Store & POS",
  "/inventory": "Inventory",
  "/members": "Members",
  "/tournaments": "Tournament",
  "/reports": "Reports",
  "/settings": "Settings",
};

export const TopBar: React.FC = () => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="h-12 bg-[#0e1015] border-b border-[#1e212b] px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Minimal Page Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
          {title}
        </h1>
      </div>

      {/* Right: Search, Notifications, Admin Profile */}
      <div className="flex items-center gap-2.5">
        <div className="relative hidden md:block w-44">
          <Search className="w-3 h-3 text-[#717684] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141c] border border-[#222634] rounded-[2px] pl-7 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#b91c1c] transition-colors font-mono"
          />
        </div>

        <button
          className="p-1.5 rounded-[2px] text-[#8a8f9d] hover:text-zinc-200 hover:bg-[#151720] transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c] absolute top-1 right-1"></span>
        </button>

        <div className="h-3.5 w-px bg-[#222634]"></div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-300">
          <div className="w-5 h-5 rounded-[2px] bg-[#161822] border border-[#262b3a] flex items-center justify-center text-zinc-400">
            <User className="w-3 h-3" />
          </div>
          <span className="font-mono text-zinc-200 text-xs hidden sm:inline">Admin</span>
        </div>
      </div>
    </header>
  );
};
