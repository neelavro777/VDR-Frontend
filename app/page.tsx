"use client";

import React, { useState } from "react";
import ActivityLog from "./components/ActivityLog";
import CrewTable from "./components/CrewTable";

export default function Home() {
  const [activeView, setActiveView] = useState<"operations" | "crew">("operations");
  const [entriesCount, setEntriesCount] = useState(0);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ——— Header ——— */}
      <header className="sticky top-0 z-40 bg-surface border-b border-surface-border shadow-lg shadow-black/20">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-lg shadow-[0_0_12px_var(--color-primary-glow)]">
                <svg className="w-5 h-5 text-gray-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16l2-7h4l2 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight tracking-tight">
                  Vessel Data Recorder
                </h1>
                <p className="text-xs text-gray-400 leading-none mt-0.5">
                  Daily Operations Log
                </p>
              </div>
            </div>

            {/* Center: Tabs */}
            <nav className="inline-flex rounded-lg border border-surface-border overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveView("operations")}
                className={`px-6 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2
                  ${activeView === "operations"
                    ? "bg-primary-100 text-primary shadow-[inset_0_0_12px_var(--color-primary-glow)]"
                    : "bg-surface text-gray-400 hover:text-foreground hover:bg-surface-hover"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Daily Operations
              </button>
              <button
                type="button"
                onClick={() => setActiveView("crew")}
                className={`px-6 py-2 text-sm font-semibold transition-all duration-200 border-l border-surface-border cursor-pointer flex items-center gap-2
                  ${activeView === "crew"
                    ? "bg-primary-100 text-primary shadow-[inset_0_0_12px_var(--color-primary-glow)]"
                    : "bg-surface text-gray-400 hover:text-foreground hover:bg-surface-hover"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Crew & Contractors
              </button>
            </nav>

            {/* Right: Date + Vessel badge */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-end gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{today}</p>
                  <p className="text-xs text-gray-400">Voyage Log</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-muted rounded-lg">
                  <span className="w-2 h-2 bg-success rounded-full animate-glow-pulse" />
                  <span className="text-xs font-bold text-primary">
                    MV Pacific Star
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ——— Main content ——— */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {activeView === "operations" ? <ActivityLog onEntriesChange={setEntriesCount} /> : <CrewTable />}
      </main>
    </div>
  );
}
