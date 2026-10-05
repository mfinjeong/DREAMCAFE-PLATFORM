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
    <header className="h-12 bg-[#111317] border-b border-[#22252A] px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Minimal Page Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
          {title}
        </h1>
      </div>

      {/* Right: Search, Notifications, Admin Profile */}
      <div className="flex items-center gap-2.5">
        <div className="relative hidden md:block w-48">
          <Search className="w-3 h-3 text-[#585C66] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#15171A] border border-[#22252A] rounded-[4px] pl-7 pr-2.5 py-1 text-xs text-[#EDEDEE] placeholder-[#585C66] focus:outline-none focus:border-[#B4232A] transition-colors font-mono"
          />
        </div>

        <button
          className="p-1.5 rounded-[4px] text-[#8A909A] hover:text-[#EDEDEE] hover:bg-[#15171A] transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#B4232A] absolute top-1 right-1"></span>
        </button>

        <div className="h-3.5 w-px bg-[#22252A]"></div>

        <div className="flex items-center gap-1.5 text-xs text-[#8A909A]">
          <div className="w-5 h-5 rounded-[4px] bg-[#15171A] border border-[#22252A] flex items-center justify-center text-[#8A909A]">
            <User className="w-3 h-3" />
          </div>
          <span className="font-mono text-[#EDEDEE] text-xs hidden sm:inline font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
};
