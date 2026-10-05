"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, User } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/pc": "PC",
  "/consoles": "Console",
  "/sessions": "Sessions",
  "/booking": "Booking",
  "/store": "Store",
  "/inventory": "Inventory",
  "/members": "Members",
  "/tournaments": "Tournament",
  "/reports": "Reports",
  "/settings": "Settings",
};

export const TopBar: React.FC = () => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const title = pageTitles[pathname] || "DREAMCAFE";

  return (
    <header className="h-12 bg-[#0c0d12] border-b border-[#1a1d26] px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Concise Page Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
          {title}
        </h1>
      </div>

      {/* Right: Search, Notifications, Admin Profile */}
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block w-48">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#13151d] border border-[#212530] rounded pl-7 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
          />
        </div>

        <button
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#161821] transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 absolute top-1 right-1"></span>
        </button>

        <div className="h-4 w-px bg-[#212530]"></div>

        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <div className="w-6 h-6 rounded bg-[#181a24] border border-[#262a38] flex items-center justify-center text-zinc-400">
            <User className="w-3 h-3" />
          </div>
          <span className="font-medium hidden sm:inline text-zinc-200 text-xs">Admin</span>
        </div>
      </div>
    </header>
  );
};
