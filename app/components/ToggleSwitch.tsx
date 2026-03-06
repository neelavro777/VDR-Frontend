"use client";

import React from "react";

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
    label?: string;
}

export default function ToggleSwitch({
    checked,
    onChange,
    id,
    label,
}: ToggleSwitchProps) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(!checked);
                }
            }}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 cursor-pointer
        ${checked ? "bg-primary" : "bg-gray-300"}`}
        >
            <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200
          ${checked ? "translate-x-6" : "translate-x-1"}`}
            />
            <span className="sr-only">{checked ? "Yes" : "No"}</span>
        </button>
    );
}
