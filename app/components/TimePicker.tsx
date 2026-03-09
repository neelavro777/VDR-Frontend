"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface TimePickerProps {
    value: string; // "HHMM" format, e.g. "0700"
    onChange: (value: string) => void;
    readOnly?: boolean;
    id?: string;
    onComplete?: () => void;
    minTime?: string;
    label?: string; // "FROM" or "TO"
    size?: "sm" | "md";
}

function timeToMinutes(t: string): number {
    if (t.length !== 4) return -1;
    return parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(2, 4), 10);
}

export function isValidTime(raw: string): boolean {
    if (raw.length !== 4) return false;
    const hh = parseInt(raw.slice(0, 2), 10);
    const mm = parseInt(raw.slice(2, 4), 10);
    if (hh === 24 && mm === 0) return true;
    if (hh > 23 || mm > 59) return false;
    return true;
}

export { timeToMinutes };

// Generate full sets — filtered dynamically per-instance based on minTime
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")); // 00–23
const ALL_MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")); // 00–59

export default function TimePicker({
    value, onChange, readOnly = false, id, onComplete, minTime, label, size = "md",
}: TimePickerProps) {
    const [localHh, setLocalHh] = useState(value.length >= 2 ? value.slice(0, 2) : "");
    const [localMm, setLocalMm] = useState(value.length >= 4 ? value.slice(2, 4) : "");

    // Sync from props
    useEffect(() => {
        setLocalHh(value.length >= 2 ? value.slice(0, 2) : "");
        setLocalMm(value.length >= 4 ? value.slice(2, 4) : "");
    }, [value]);

    const hh = localHh;
    const mm = localMm;

    const [hhOpen, setHhOpen] = useState(false);
    const [mmOpen, setMmOpen] = useState(false);
    const [error, setError] = useState("");
    const hhRef = useRef<HTMLDivElement>(null);
    const mmRef = useRef<HTMLDivElement>(null);
    const hhListRef = useRef<HTMLDivElement>(null);
    const mmListRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (hhRef.current && !hhRef.current.contains(e.target as Node)) {
                setHhOpen(false);
                // trigger blur-like commit if missing padding
                setLocalHh(prev => {
                    const padded = prev ? prev.padStart(2, "0") : "";
                    if (prev && prev !== padded) onChange(padded + (localMm || ""));
                    return padded;
                });
            }
            if (mmRef.current && !mmRef.current.contains(e.target as Node)) {
                setMmOpen(false);
                // trigger blur-like commit
                setLocalMm(prev => {
                    const padded = prev ? prev.padStart(2, "0") : "";
                    if (prev && prev !== padded) onChange((localHh || "") + padded);
                    return padded;
                });
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [localHh, localMm, onChange]);

    // Scroll to selected item when opening
    useEffect(() => {
        if (hhOpen && hhListRef.current && hh) {
            const idx = parseInt(hh);
            hhListRef.current.scrollTop = idx * 32 - 64;
        }
    }, [hhOpen, hh]);

    useEffect(() => {
        if (mmOpen && mmListRef.current && mm) {
            const idx = parseInt(mm);
            mmListRef.current.scrollTop = idx * 32 - 64;
        }
    }, [mmOpen, mm]);

    const validate = useCallback((newVal: string) => {
        if (newVal.length === 4 && isValidTime(newVal)) {
            if (minTime && minTime.length === 4 && timeToMinutes(newVal) <= timeToMinutes(minTime)) {
                setError(`After ${minTime.slice(0, 2)}:${minTime.slice(2)}`);
                return false;
            }
            setError("");
            return true;
        }
        if (newVal.length === 4) setError("Invalid");
        else setError("");
        return false;
    }, [minTime]);

    /* ——— Dynamic hour/minute options based on minTime ——— */
    const minHour = minTime && minTime.length >= 2 ? parseInt(minTime.slice(0, 2), 10) : 0;
    const minMinute = minTime && minTime.length >= 4 ? parseInt(minTime.slice(2, 4), 10) : 0;

    const filteredHours = ALL_HOURS.filter((h) => parseInt(h, 10) >= minHour);
    const filteredMinutes = (() => {
        const selectedHour = parseInt(hh, 10);
        if (!isNaN(selectedHour) && selectedHour === minHour) {
            // Same hour as FROM — only show minutes strictly after FROM's minute
            return ALL_MINUTES.filter((m) => parseInt(m, 10) > minMinute);
        }
        return ALL_MINUTES;
    })();

    const selectHour = useCallback((h: string) => {
        setLocalHh(h);
        // If same hour as minTime, auto-pick next valid minute
        const selectedHour = parseInt(h, 10);
        let newMm = localMm;
        if (selectedHour === minHour && (localMm === "" || parseInt(localMm, 10) <= minMinute)) {
            newMm = (minMinute + 1).toString().padStart(2, "0");
            if (parseInt(newMm, 10) > 59) newMm = "";
            setLocalMm(newMm);
        }
        const newVal = h + (newMm || "");
        onChange(newVal);
        setHhOpen(false);
        // Auto-open minutes
        setTimeout(() => {
            setMmOpen(true);
            document.getElementById(`mm-input-${id || 'timepicker'}`)?.focus();
        }, 100);
    }, [localMm, onChange, id, minHour, minMinute]);

    const selectMinute = useCallback((m: string) => {
        setLocalMm(m);
        const newVal = (localHh || "") + m;
        onChange(newVal);
        setMmOpen(false);
        if (validate(newVal) && onComplete) {
            setTimeout(() => onComplete(), 80);
        }
    }, [localHh, onChange, validate, onComplete]);

    const isComplete = value.length === 4 && isValidTime(value);
    const hasError = error.length > 0;

    return (
        <div className="flex flex-col items-center gap-1 relative" id={id}>
            {label && (
                <span className="text-xs font-bold text-sky-300 uppercase tracking-widest">{label}</span>
            )}
            <div className={`flex items-center gap-0.5 rounded-lg border ${size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1"} transition-all duration-200
                ${readOnly
                    ? "bg-surface-raised/50 border-surface-border"
                    : hasError
                        ? "bg-danger-muted/30 border-danger"
                        : isComplete
                            ? "bg-[#1e293b] border-primary-muted shadow-[0_0_8px_var(--color-primary-glow)]"
                            : "bg-[#1e293b] border-surface-border hover:border-gray-500"
                }`}
            >
                {/* Clock Icon */}
                <svg className={`${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} mr-1 ${isComplete ? "text-primary" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                {/* Hour selector */}
                <div ref={hhRef} className="relative">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={hh}
                        onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (parseInt(val) > 23) val = val[0] || "";
                            setLocalHh(val);
                            setHhOpen(true);
                            if (val.length === 2) {
                                setHhOpen(false);
                                const newVal = val + (localMm || "");
                                onChange(newVal);
                                setTimeout(() => {
                                    setMmOpen(true);
                                    document.getElementById(`mm-input-${id || 'timepicker'}`)?.focus();
                                }, 50);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Tab" && !e.shiftKey || e.key === "Enter") {
                                e.preventDefault();
                                const padded = (localHh || "").padStart(2, "0");
                                setLocalHh(padded);
                                const newVal = padded + (localMm || "");
                                onChange(newVal);
                                setHhOpen(false);
                                setTimeout(() => {
                                    setMmOpen(true);
                                    document.getElementById(`mm-input-${id || 'timepicker'}`)?.focus();
                                }, 50);
                            }
                        }}
                        onBlur={() => {
                            const padded = (localHh || "").padStart(2, "0");
                            if (padded !== localHh) {
                                setLocalHh(padded);
                                onChange(padded + (localMm || ""));
                            }
                        }}
                        onFocus={() => { if (!readOnly) setHhOpen(true); }}
                        onClick={() => { if (!readOnly) setHhOpen(true); }}
                        readOnly={readOnly}
                        placeholder={hh ? undefined : "HH"}
                        className={`${size === "sm" ? "w-6 text-sm" : "w-9 text-lg"} text-center bg-transparent outline-none flex items-center justify-center font-bold font-[family-name:var(--font-jetbrains)] rounded transition-all duration-200
                            ${readOnly
                                ? "text-gray-500 cursor-default"
                                : hasError
                                    ? "text-danger"
                                    : isComplete
                                        ? "text-primary"
                                        : "text-foreground hover:bg-surface-hover"
                            } ${hhOpen ? "bg-surface-hover" : ""}`}
                    />
                    {hhOpen && (
                        <div
                            ref={hhListRef}
                            className="absolute z-50 top-full mt-2 -left-4 w-14 max-h-40 overflow-auto rounded-lg border border-gray-600 bg-[#0f172a] shadow-2xl py-1 animate-fade-in"
                        >
                            {filteredHours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); selectHour(h); }}
                                    className={`w-full py-1.5 text-center text-sm font-[family-name:var(--font-jetbrains)] font-semibold transition-colors cursor-pointer
                    ${h === hh ? "bg-primary-100 text-primary" : "text-foreground hover:bg-surface-hover"}`}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Colon separator */}
                <span className={`${size === "sm" ? "text-sm" : "text-lg"} font-bold font-[family-name:var(--font-jetbrains)] pb-0.5 ${isComplete ? "text-primary/70" : "text-gray-600"}`}>:</span>

                {/* Minute selector */}
                <div ref={mmRef} className="relative">
                    <input
                        id={`mm-input-${id || 'timepicker'}`}
                        type="text"
                        inputMode="numeric"
                        value={mm}
                        onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (parseInt(val) > 59) val = val[0] || "";
                            setLocalMm(val);
                            setMmOpen(true);
                            if (val.length === 2) {
                                setMmOpen(false);
                                const newVal = (localHh || "") + val;
                                onChange(newVal);
                                if (validate(newVal) && onComplete) {
                                    setTimeout(() => onComplete(), 50);
                                }
                            }
                        }}
                        onBlur={() => {
                            const padded = (localMm || "").padStart(2, "0");
                            if (padded !== localMm) {
                                setLocalMm(padded);
                                onChange((localHh || "") + padded);
                            }
                        }}
                        onFocus={() => { if (!readOnly) setMmOpen(true); }}
                        onClick={() => { if (!readOnly) setMmOpen(true); }}
                        readOnly={readOnly}
                        placeholder={mm ? undefined : "MM"}
                        className={`${size === "sm" ? "w-6 text-sm" : "w-9 text-lg"} text-center bg-transparent outline-none flex items-center justify-center font-bold font-[family-name:var(--font-jetbrains)] rounded transition-all duration-200
                            ${readOnly
                                ? "text-gray-500 cursor-default"
                                : hasError
                                    ? "text-danger"
                                    : isComplete
                                        ? "text-primary"
                                        : "text-foreground hover:bg-surface-hover"
                            } ${mmOpen ? "bg-surface-hover" : ""}`}
                    />
                    {mmOpen && (
                        <div
                            ref={mmListRef}
                            className="absolute z-50 top-full mt-2 -right-4 w-14 max-h-40 overflow-auto rounded-lg border border-gray-600 bg-[#0f172a] shadow-2xl py-1 animate-fade-in"
                        >
                            {filteredMinutes.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); selectMinute(m); }}
                                    className={`w-full py-1.5 text-center text-sm font-[family-name:var(--font-jetbrains)] font-semibold transition-colors cursor-pointer
                    ${m === mm ? "bg-primary-100 text-primary" : "text-foreground hover:bg-surface-hover"}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {hasError && (
                <span className="absolute top-full mt-1 text-[10px] font-bold text-danger animate-fade-in whitespace-nowrap">{error}</span>
            )}
        </div>
    );
}
