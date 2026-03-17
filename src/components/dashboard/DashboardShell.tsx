"use client";

import { TopBar } from "./TopBar";
import { IconSidebar } from "./IconSidebar";
import { TacticalMap } from "./TacticalMap";
import { MarketTicker } from "./MarketTicker";
import { IntelFeed } from "./IntelFeed";

export function DashboardShell() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Icon Sidebar */}
        <IconSidebar />

        {/* Map Area */}
        <div className="flex-1 relative overflow-hidden">
          <TacticalMap />
          <MarketTicker />
        </div>

        {/* Right Panel */}
        <div className="hidden lg:block w-[360px]">
          <IntelFeed />
        </div>
      </div>
    </div>
  );
}
