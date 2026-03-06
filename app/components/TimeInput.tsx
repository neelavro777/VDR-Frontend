"use client";

import React, { useState, useRef, useCallback } from "react";

interface TimeInputProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    placeholder?: string;
    id?: string;
    onComplete?: () => void;
    minTime?: string;
    error?: string;
}

function timeToMinutes(t: string): number {
    return parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(2, 4), 10);
}

function isValidTime(raw: string): boolean {
    if (raw.length !== 4) return false;
    const hh = parseInt(raw.slice(0, 2), 10);
    const mm = parseInt(raw.slice(2, 4), 10);
    if (hh === 24 && mm === 0) return true;
    if (hh > 23) return false;
    if (mm > 59) return false;
    return true;
}

export { isValidTime, timeToMinutes };

export default function TimeInput({
    value,
    onChange,
    readOnly = false,
    placeholder = "HHMM",
    id,
    onComplete,
    minTime,
    error: externalError,
}: TimeInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [touched, setTouched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const formatDisplay = (raw: string): string => {
        if (raw.length === 0) return "";
        if (raw.length <= 2) return raw;
        return raw.slice(0, 2) + ":" + raw.slice(2);
    };

    let errorMsg = externalError || "";
    if (touched && !isFocused && value.length > 0 && value.length < 4) {
        errorMsg = "Need 4 digits";
    } else if (touched && !isFocused && value.length === 4 && !isValidTime(value)) {
        errorMsg = "Invalid time";
    } else if (
        touched && !isFocused && value.length === 4 && isValidTime(value) &&
        minTime && minTime.length === 4 && timeToMinutes(value) <= timeToMinutes(minTime)
    ) {
        errorMsg = `Must be > ${minTime.slice(0, 2)}:${minTime.slice(2)}`;
    }
    const hasError = errorMsg.length > 0;
    const isComplete = value.length === 4 && isValidTime(value);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
            onChange(raw);
            if (raw.length === 4 && isValidTime(raw)) {
                if (!minTime || minTime.length !== 4 || timeToMinutes(raw) > timeToMinutes(minTime)) {
                    if (onComplete) setTimeout(() => onComplete(), 50);
                }
            }
        },
        [onChange, onComplete, minTime]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (value.length === 4 && isValidTime(value) && onComplete) {
                    if (!minTime || minTime.length !== 4 || timeToMinutes(value) > timeToMinutes(minTime)) {
                        onComplete();
                    }
                }
            }
        },
        [value, onComplete, minTime]
    );

    return (
        <div className="relative">
            <input
                ref={inputRef}
                id={id}
                type="text"
                inputMode="numeric"
                value={isFocused ? value : formatDisplay(value)}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => { setIsFocused(false); setTouched(true); }}
                onKeyDown={handleKeyDown}
                readOnly={readOnly}
                placeholder={placeholder}
                className={`w-[76px] px-2.5 py-2 text-center text-sm font-[family-name:var(--font-jetbrains)] rounded-lg border transition-all duration-200
          ${readOnly
                        ? "bg-surface-raised border-surface-border text-gray-500 cursor-default"
                        : hasError
                            ? "bg-danger-muted border-danger text-danger shadow-[0_0_8px_rgba(248,113,113,0.25)]"
                            : isFocused
                                ? "bg-surface border-primary text-gray-800 shadow-[0_0_12px_var(--color-primary-glow)]"
                                : isComplete
                                    ? "bg-primary-50 border-primary-muted text-primary shadow-[0_0_4px_var(--color-primary-glow)]"
                                    : "bg-surface border-surface-border text-foreground hover:border-gray-300"
                    }`}
                maxLength={5}
            />
            {hasError && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 text-[10px] font-semibold text-danger bg-danger-muted border border-danger/30 rounded whitespace-nowrap z-10 animate-fade-in">
                    {errorMsg}
                </div>
            )}
        </div>
    );
}
