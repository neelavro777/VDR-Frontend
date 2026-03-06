"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface SearchableDropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
    onComplete?: () => void;
    error?: boolean;
}

export default function SearchableDropdown({
    options, value, onChange, placeholder = "Select...", id, onComplete, error,
}: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightIndex, setHighlightIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = options.filter((opt) =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => { setHighlightIndex(0); }, [search]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectOption = useCallback((opt: string) => {
        onChange(opt);
        setIsOpen(false);
        setSearch("");
        if (onComplete) setTimeout(() => onComplete(), 50);
    }, [onChange, onComplete]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
            e.preventDefault();
            setIsOpen(true);
            return;
        }
        if (!isOpen) {
            if (e.key === "Enter" && value && onComplete) {
                e.preventDefault();
                onComplete();
            }
            return;
        }
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightIndex((prev) => Math.max(prev - 1, 0));
                break;
            case "Enter":
                e.preventDefault();
                if (filtered[highlightIndex]) selectOption(filtered[highlightIndex]);
                break;
            case "Escape":
            case "Tab":
                setIsOpen(false);
                setSearch("");
                break;
        }
    }, [isOpen, filtered, highlightIndex, selectOption, value, onComplete]);

    const displayValue = isOpen ? search : value;

    return (
        <div ref={containerRef} className="relative w-full">
            <input
                ref={inputRef}
                id={id}
                type="text"
                value={displayValue}
                onChange={(e) => { setSearch(e.target.value); if (!isOpen) setIsOpen(true); }}
                onFocus={() => { setIsOpen(true); setSearch(""); }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none transition-all duration-200 truncate pr-8
                    bg-surface text-foreground font-[family-name:var(--font-jetbrains)]
                    ${error
                        ? "border-danger placeholder-danger/60 focus:border-danger focus:shadow-[0_0_8px_rgba(248,113,113,0.3)] bg-danger-muted/30 text-danger"
                        : "border-surface-border hover:border-gray-300 focus:border-primary focus:shadow-[0_0_12px_var(--color-primary-glow)] focus:placeholder-transparent"
                    }`}
            />
            <svg
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-transform duration-200 pointer-events-none 
                    ${error ? "text-danger" : "text-gray-400"} 
                    ${isOpen ? "rotate-180 !text-primary" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>

            {isOpen && (
                <ul className="absolute z-50 mt-1 min-w-full w-max max-w-[420px] max-h-56 overflow-auto rounded-lg border border-surface-border bg-surface-raised shadow-2xl py-1 text-sm right-0 animate-fade-in">
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2.5 text-gray-400 italic">No matches</li>
                    ) : (
                        filtered.map((opt, i) => (
                            <li
                                key={opt}
                                onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
                                onMouseEnter={() => setHighlightIndex(i)}
                                className={`px-3 py-2.5 cursor-pointer transition-colors duration-75 whitespace-nowrap ${i === highlightIndex
                                    ? "bg-primary-100 text-primary"
                                    : "text-foreground hover:bg-surface-hover"
                                    } ${opt === value ? "font-semibold" : ""}`}
                            >
                                {opt === value && (
                                    <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mr-2 align-middle" />
                                )}
                                {opt}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
