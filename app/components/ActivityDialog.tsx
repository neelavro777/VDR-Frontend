"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import TimePicker, { isValidTime, timeToMinutes } from "./TimePicker";
import ChipSelector from "./ChipSelector";
import Tooltip from "./Tooltip";

/* ——— Public type used by ActivityLog ——— */
export interface DialogDraft {
    from: string;
    to: string;
    activity: string;
    category: string;
    dp: boolean;
    lifts: string;
    pob: string;
}

const VESSEL_CATEGORIES = [
    "Maneuvering at Supply Base",
    "Alongside berth at Supply Base",
    "Anchorage at Supply Base",
    "En-route: full speed",
    "En-route: economical speed",
    "Inter-rig/ Maneuvering offshore",
    "Standby steaming offshore",
    "Cargo works within 500m zone",
    "Towing/ Static Towing/ Rigmove/ Hose Handling",
    "Mooring to buoy/platform offshore",
];

const STEPS = [
    { label: "Time", icon: "clock" },
    { label: "Details", icon: "sliders" },
    { label: "Location", icon: "map" },
    { label: "Category", icon: "tag" },
] as const;

/* ——— DP Toggle (pill-shaped) ——— */
function DPToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="inline-flex rounded-lg overflow-hidden border border-surface-border bg-[#1e293b]">
            <button type="button" onClick={() => onChange(true)}
                className={`w-14 h-11 flex items-center justify-center text-sm font-extrabold transition-all duration-150 cursor-pointer
                    ${checked ? "bg-primary-200 text-primary shadow-[0_0_8px_var(--color-primary-glow)]" : "text-gray-500 hover:text-sky-300"}`}>
                Y
            </button>
            <button type="button" onClick={() => onChange(false)}
                className={`w-14 h-11 flex items-center justify-center text-sm font-extrabold transition-all duration-150 border-l border-surface-border cursor-pointer
                    ${!checked ? "bg-warning-muted text-warning shadow-[inset_0_0_8px_rgba(251,191,36,0.1)]" : "text-gray-500 hover:text-sky-300"}`}>
                N
            </button>
        </div>
    );
}

/* ——— Stepper Input ——— */
function StepperInput({ value, onChange, label, max = 9999 }: {
    value: string; onChange: (v: string) => void; label: string; max?: number;
}) {
    const num = parseInt(value) || 0;
    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-widest">{label}</span>
            <div className="flex items-center rounded-lg border border-surface-border bg-[#1e293b] overflow-hidden">
                <button type="button" onClick={() => { if (num > 0) onChange(String(num - 1)); }}
                    className="w-10 h-11 flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-surface-hover transition-all cursor-pointer text-lg font-bold">
                    −
                </button>
                <input type="text" inputMode="numeric" maxLength={4} value={value}
                    onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v === "" || parseInt(v) <= max) onChange(v);
                    }}
                    onFocus={(e) => e.target.select()}
                    placeholder={value ? undefined : "0"}
                    className="w-14 h-11 text-center text-base font-[family-name:var(--font-jetbrains)] font-semibold bg-transparent text-foreground border-0 focus:outline-none focus:shadow-[0_0_8px_var(--color-primary-glow)] transition-all duration-150" />
                <button type="button" onClick={() => { if (num < max) onChange(String(num + 1)); }}
                    className="w-10 h-11 flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-surface-hover transition-all cursor-pointer text-lg font-bold">
                    +
                </button>
            </div>
        </div>
    );
}

/* ———————————————— Step Icons ———————————————— */
function StepIcon({ type, active }: { type: string; active: boolean }) {
    const cls = `w-5 h-5 ${active ? "text-primary" : "text-gray-500"}`;
    switch (type) {
        case "clock":
            return (<svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
        case "sliders":
            return (<svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75M10.5 18a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m6-6h6.75M13.5 12a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h7.5" /></svg>);
        case "map":
            return (<svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);
        case "tag":
            return (<svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>);
        default:
            return null;
    }
}

/* ————————————————————————————————————————————
   ActivityDialog — 4-step wizard
   ———————————————————————————————————————————— */
interface ActivityDialogProps {
    fromTime: string;
    isFirst: boolean;
    onComplete: (draft: DialogDraft) => void;
    onClose: () => void;
}

export default function ActivityDialog({ fromTime, isFirst, onComplete, onClose }: ActivityDialogProps) {
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState<"forward" | "back">("forward");

    /* Draft state */
    const [to, setTo] = useState("");
    const [dp, setDp] = useState(true);
    const [lifts, setLifts] = useState("");
    const [pob, setPob] = useState("");
    const [activity, setActivity] = useState("");
    const [category, setCategory] = useState("");

    const backdropRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Focus activity input on step 2 */
    useEffect(() => {
        if (step === 2 && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [step]);

    /* Close on Escape */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    /* Duration computation */
    const duration = (() => {
        if (!isValidTime(fromTime) || !isValidTime(to)) return "—";
        const diff = timeToMinutes(to) - timeToMinutes(fromTime);
        if (diff <= 0) return "—";
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    })();

    const canAdvanceStep0 = isValidTime(to) && timeToMinutes(to) > timeToMinutes(fromTime);

    const goNext = useCallback(() => {
        setDir("forward");
        setStep(s => Math.min(s + 1, 3));
    }, []);

    const goBack = useCallback(() => {
        setDir("back");
        setStep(s => Math.max(s - 1, 0));
    }, []);

    const handleComplete = useCallback(() => {
        if (!category) return;
        onComplete({ from: fromTime, to, activity, category, dp, lifts, pob });
    }, [fromTime, to, activity, category, dp, lifts, pob, onComplete]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === backdropRef.current) onClose();
    }, [onClose]);

    /* ——— Step content renderers ——— */
    const renderStep0 = () => (
        <div className="flex flex-col items-center gap-8 py-4">
            <p className="text-sm text-gray-400 text-center">
                {isFirst
                    ? "Your first activity starts at 00:00. Select the end time below."
                    : `This activity continues from ${fromTime.slice(0, 2)}:${fromTime.slice(2)}. Select the end time.`}
            </p>
            <div className="flex items-center gap-6">
                {/* FROM */}
                <TimePicker value={fromTime} onChange={() => { }} readOnly label="From" />

                {/* Arrow */}
                <div className="pt-5">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </div>

                {/* TO */}
                <TimePicker value={to} onChange={setTo} label="To" minTime={fromTime} />
            </div>

            {/* Duration indicator */}
            <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-widest">Duration</span>
                <span className={`px-5 h-10 flex items-center justify-center text-base font-bold font-[family-name:var(--font-jetbrains)] rounded-lg ${duration === "—"
                    ? "text-gray-500 bg-[#1e293b] border border-surface-border"
                    : "text-primary bg-[#1e293b] border border-primary-muted shadow-[0_0_8px_var(--color-primary-glow)]"
                    }`}>
                    {duration}
                </span>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="flex flex-col items-center gap-8 py-4">
            <p className="text-sm text-gray-400 text-center">
                Set the operational details for this activity period.
            </p>
            <div className="flex items-center gap-10">
                {/* DP */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-widest flex items-center gap-1">
                        DP <Tooltip content="Dynamic Positioning mode" />
                    </span>
                    <DPToggle checked={dp} onChange={setDp} />
                </div>

                {/* Lifts */}
                <StepperInput value={lifts} onChange={setLifts} label="Lifts" />

                {/* POB */}
                <StepperInput value={pob} onChange={setPob} label="POB" />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-sm text-gray-400 text-center">
                Describe what the vessel is doing and where.
            </p>
            <div className="w-full max-w-lg">
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-widest mb-2">
                    Activity & Location
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); goNext(); } }}
                    placeholder="e.g. VESSEL OUTSIDE 500MZ AT BRE"
                    className="vdr-input text-base py-3"
                />
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-sm text-gray-400 text-center">
                Select the vessel movement category for this period.
            </p>
            <div className="w-full max-w-2xl">
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-widest mb-2">
                    Vessel Movement Category
                </label>
                <ChipSelector
                    options={VESSEL_CATEGORIES}
                    value={category}
                    onChange={setCategory}
                />
            </div>
        </div>
    );

    const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3];

    return (
        /* Backdrop */
        <div
            ref={backdropRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-backdrop-in"
        >
            {/* Dialog */}
            <div className="relative w-full max-w-2xl mx-4 bg-surface rounded-2xl border border-surface-border shadow-2xl shadow-black/40 animate-dialog-in overflow-hidden">

                {/* Close button */}
                <button type="button" onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-1.5 text-gray-500 hover:text-foreground hover:bg-surface-hover rounded-lg transition-all cursor-pointer"
                    aria-label="Close dialog">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Step indicator */}
                <div className="px-8 pt-7 pb-2">
                    <div className="flex items-center justify-center gap-1">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.label}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (i < step) { setDir("back"); setStep(i); }
                                        else if (i === step + 1 && (step !== 0 || canAdvanceStep0)) { setDir("forward"); setStep(i); }
                                    }}
                                    disabled={i > step + 1 || (i > step && step === 0 && !canAdvanceStep0)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
                                        ${i === step
                                            ? "bg-primary-200 text-primary shadow-[0_0_8px_var(--color-primary-glow)]"
                                            : i < step
                                                ? "text-primary/70 hover:bg-primary-50"
                                                : "text-gray-500 cursor-default"
                                        }`}
                                >
                                    <StepIcon type={s.icon} active={i <= step} />
                                    <span className="hidden sm:inline">{s.label}</span>
                                    {i < step && (
                                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-6 h-px ${i < step ? "bg-primary/50" : "bg-surface-border"}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-foreground text-center mt-4">
                        {step === 0 && "Set Time Period"}
                        {step === 1 && "Operational Details"}
                        {step === 2 && "Activity & Location"}
                        {step === 3 && "Vessel Movement Category"}
                    </h3>
                </div>

                {/* Step content — animated */}
                <div className="relative z-20 px-8 py-2 min-h-[260px]">
                    <div key={step} className={dir === "forward" ? "animate-step-forward" : "animate-step-back"}>
                        {stepRenderers[step]()}
                    </div>
                </div>

                {/* Footer: Back / Next / Complete */}
                <div className="relative z-10 flex items-center justify-between px-8 py-5 border-t border-surface-border bg-surface-raised/50">
                    {/* Left: step counter */}
                    <span className="text-xs text-gray-500 font-[family-name:var(--font-jetbrains)]">
                        Step {step + 1} of {STEPS.length}
                    </span>

                    <div className="flex items-center gap-3">
                        {step > 0 && (
                            <button type="button" onClick={goBack}
                                className="px-5 py-2.5 text-sm font-bold border border-surface-border text-gray-300 rounded-xl hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer">
                                Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button type="button" onClick={goNext}
                                disabled={step === 0 && !canAdvanceStep0}
                                className="px-6 py-2.5 text-sm font-bold bg-primary/20 text-primary border border-primary rounded-xl hover:bg-primary/30 hover:shadow-[0_0_12px_var(--color-primary-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                                Next
                            </button>
                        ) : (
                            <button type="button" onClick={handleComplete}
                                disabled={!category}
                                className="px-6 py-2.5 text-sm font-bold bg-primary text-gray-900 rounded-xl hover:bg-primary-hover hover:shadow-[0_0_16px_var(--color-primary-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Complete Entry
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
