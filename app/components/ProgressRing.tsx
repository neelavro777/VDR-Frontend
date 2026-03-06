"use client";

import React from "react";

interface ProgressRingProps {
    current: number; // minutes logged
    total: number;   // 1440 (24h)
    dayComplete: boolean;
}

export default function ProgressRing({ current, total, dayComplete }: ProgressRingProps) {
    const pct = Math.min(current / total, 1);
    const overLimit = current > total;

    // SVG donut params
    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - pct);

    const h = Math.floor(current / 60);
    const m = current % 60;
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

    const ringColor = overLimit
        ? "stroke-danger drop-shadow-[0_0_8px_var(--color-danger)]"
        : dayComplete
            ? "stroke-success drop-shadow-[0_0_8px_var(--color-success)]"
            : "stroke-primary drop-shadow-[0_0_8px_var(--color-primary-glow)]";

    return (
        <div className="relative group" style={{ width: size, height: size }}>
            {/* Glow behind */}
            <div className={`absolute inset-0 rounded-full blur-md opacity-20 transition-all duration-700
        ${overLimit ? "bg-danger" : dayComplete ? "bg-success" : "bg-primary"}`}
            />

            <svg width={size} height={size} className="-rotate-90 relative z-10">
                {/* Background ring */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className="stroke-surface-border"
                />
                {/* Progress ring */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className={`${ringColor} transition-all duration-700 ease-out`}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                <span className={`text-base font-bold font-[family-name:var(--font-jetbrains)] tracking-tight
            ${overLimit ? "text-danger" : "text-foreground"}`}>
                    {timeStr}
                </span>
            </div>

            {/* Hover tooltip for status */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                <div className="bg-surface-raised border border-surface-border px-3 py-1.5 rounded-lg shadow-xl text-xs font-semibold ml-4">
                    {overLimit && <span className="text-danger flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" /> Exceeds 24h</span>}
                    {dayComplete && <span className="text-success flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-success rounded-full" /> 24:00 Logged</span>}
                    {!overLimit && !dayComplete && <span className="text-warning flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" /> In Progress</span>}
                </div>
            </div>
        </div>
    );
}
