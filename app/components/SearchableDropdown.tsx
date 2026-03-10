"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

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
    const [mounted, setMounted] = useState(false);
    const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0, dropUp: false });

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = options.filter((opt) =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { setHighlightIndex(0); }, [search]);

    const updateCoords = useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropUp = spaceBelow < 250 && rect.top > 250;
            setMenuCoords({
                top: rect.bottom + window.scrollY,
                bottom: window.innerHeight - rect.top - window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                dropUp
            });
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener("scroll", updateCoords, true);
            window.addEventListener("resize", updateCoords);
            return () => {
                window.removeEventListener("scroll", updateCoords, true);
                window.removeEventListener("resize", updateCoords);
            };
        }
    }, [isOpen, updateCoords]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                // Check if click was inside portal menu
                const target = e.target as HTMLElement;
                if (!target.closest('[data-dropdown-menu="true"]')) {
                    setIsOpen(false);
                    setSearch("");
                }
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
                className={`w-full px-3 py-2 text-sm border focus:outline-none transition-all duration-200 truncate pr-8 rounded-sm
                    bg-surface text-foreground font-[family-name:var(--font-jetbrains)]
                    ${error
                        ? "border-danger placeholder-danger/60 focus:border-danger focus:shadow-[0_0_8px_rgba(248,113,113,0.3)] bg-danger-muted/30 text-danger"
                        : "border-transparent hover:border-surface-border focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-glow)] focus:placeholder-transparent"
                    }`}
            />
            <svg
                onClick={() => setIsOpen((prev) => !prev)}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-[24px] cursor-pointer transition-transform duration-200 
                    ${error ? "text-danger" : "text-gray-500 hover:text-foreground"} 
                    ${isOpen ? "rotate-180 !text-primary" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>

            {isOpen && mounted && createPortal(
                <ul
                    data-dropdown-menu="true"
                    className={`absolute z-[99999] w-[var(--menu-width)] max-h-56 overflow-auto rounded-md border border-[var(--color-primary-glow)] bg-[#0f172a] shadow-[0_4px_16px_rgba(0,0,0,0.6)] py-1 text-[11px] font-[family-name:var(--font-jetbrains)] animate-fade-in ${menuCoords.dropUp ? "mb-1" : "mt-1"}`}
                    style={{
                        ...(menuCoords.dropUp
                            ? { bottom: menuCoords.bottom, left: menuCoords.left, width: menuCoords.width }
                            : { top: menuCoords.top, left: menuCoords.left, width: menuCoords.width }),
                        '--menu-width': `${menuCoords.width}px`
                    } as React.CSSProperties & { [key: string]: string | number }}
                >
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2.5 text-gray-400 italic font-[family-name:var(--font-jetbrains)]">No matches found</li>
                    ) : (
                        filtered.map((opt, i) => (
                            <li
                                key={opt}
                                onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
                                onMouseEnter={() => setHighlightIndex(i)}
                                className={`px-2.5 py-2 cursor-pointer transition-colors duration-75 whitespace-nowrap truncate ${i === highlightIndex
                                    ? "bg-primary/20 text-white border-l-2 border-primary font-bold"
                                    : "text-white hover:bg-surface-hover border-l-2 border-transparent"
                                    } ${opt === value ? "font-bold bg-surface-hover/50" : ""}`}
                            >
                                {opt}
                            </li>
                        ))
                    )}
                </ul>,
                document.body
            )}
        </div>
    );
}
