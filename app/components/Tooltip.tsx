"use client";

import React, { useState, useRef } from "react";

interface TooltipProps {
    content: string;
    children?: React.ReactNode;
    align?: "left" | "right";
}

export default function Tooltip({ content, children, align = "left" }: TooltipProps) {
    const [show, setShow] = useState(false);
    const tooltipRef = useRef<HTMLSpanElement>(null);

    return (
        <span
            ref={tooltipRef}
            className="relative inline-flex items-center ml-0.5"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children || (
                <svg
                    className="w-3.5 h-3.5 text-gray-400 hover:text-primary cursor-help transition-colors flex-shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            {show && (
                <span
                    className={`absolute z-[9999] top-full mt-2 px-3 py-1.5 text-xs text-gray-800 bg-surface-raised border border-surface-border rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-fade-in
            ${align === "right" ? "right-0" : "left-0"}`}
                >
                    {content}
                    <span
                        className={`absolute bottom-full -mb-px border-4 border-transparent border-b-surface-border
              ${align === "right" ? "right-2" : "left-2"}`}
                    />
                </span>
            )}
        </span>
    );
}
