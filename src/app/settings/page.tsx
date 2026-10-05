"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const [rates, setRates] = useState({
    regularRate: 10000,
    vipRate: 15000,
    arenaRate: 20000,
    consolePs5Rate: 20000,
    consoleSwitchRate: 15000,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3.5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#EDEDEE] uppercase tracking-wider font-mono">
          System Settings
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        {/* Hourly Rates */}
        <div className="p-3.5 bg-[#15171A] border border-[#22252A] rounded-[4px] space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A909A] font-semibold block">
            Hourly Rates (Rp/Hr)
          </span>

          <div className="grid grid-cols-3 gap-2.5">
            <Input
              label="Regular Zone"
              type="number"
              step="1000"
              value={rates.regularRate}
              onChange={(e) => setRates({ ...rates, regularRate: Number(e.target.value) })}
              required
            />
            <Input
              label="VIP Zone"
              type="number"
              step="1000"
              value={rates.vipRate}
              onChange={(e) => setRates({ ...rates, vipRate: Number(e.target.value) })}
              required
            />
            <Input
              label="Arena Esports"
              type="number"
              step="1000"
              value={rates.arenaRate}
              onChange={(e) => setRates({ ...rates, arenaRate: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#1E2126]">
            <Input
              label="Console PS5"
              type="number"
              step="1000"
              value={rates.consolePs5Rate}
              onChange={(e) => setRates({ ...rates, consolePs5Rate: Number(e.target.value) })}
              required
            />
            <Input
              label="Console Switch"
              type="number"
              step="1000"
              value={rates.consoleSwitchRate}
              onChange={(e) => setRates({ ...rates, consoleSwitchRate: Number(e.target.value) })}
              required
            />
          </div>
        </div>

        {/* Policy Notice */}
        <div className="p-3 bg-[#111317] border border-[#22252A] rounded-[4px] text-xs space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A909A] font-bold block">
            Payment Mode: CASH ONLY
          </span>
          <p className="text-[11px] text-[#585C66]">
            DREAMCAFE operates exclusively on physical cash transactions. Online gateways are disabled.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {saved && (
            <span className="text-[11px] font-mono text-[#9CB1A3]">Settings Saved</span>
          )}
          <Button type="submit" variant="primary" size="sm">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
