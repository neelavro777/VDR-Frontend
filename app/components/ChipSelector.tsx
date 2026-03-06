"use client";

import React from "react";

interface ChipSelectorProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    id?: string;
    onComplete?: () => void;
}

export default function ChipSelector({
    options, value, onChange, id, onComplete,
}: ChipSelectorProps) {
    const handleSelect = (opt: string) => {
        // Single-select: clicking the already-selected chip deselects it
        const newVal = opt === value ? "" : opt;
        onChange(newVal);
        if (newVal && onComplete) {
            setTimeout(() => onComplete(), 80);
        }
    };

    return (
        <div id={id} className="flex flex-wrap gap-1.5">
            {options.map((opt) => {
                const isSelected = opt === value;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelect(opt)}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 cursor-pointer whitespace-nowrap min-h-[40px]
              ${isSelected
                                ? "bg-primary-200 border-primary text-primary shadow-[0_0_10px_var(--color-primary-glow)]"
                                : "bg-surface border-surface-border text-gray-400 hover:text-foreground hover:border-gray-300 hover:bg-surface-hover"
                            }`}
                    >
                        {isSelected && (
                            <svg className="inline w-3 h-3 mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}
