"use client";

import React, { useState, useCallback, useMemo } from "react";
import TimePicker, { isValidTime, timeToMinutes } from "./TimePicker";
import ActivityDialog, { type DialogDraft, VESSEL_CATEGORIES, LOCATIONS } from "./ActivityDialog";

interface Activity {
    id: string;
    from: string;
    to: string;
    activity: string;
    location: string;
    category: string;
    dp: boolean;
    lifts: string;
    pob: string;
    isFinished: boolean;
}

function createActivity(draft: DialogDraft): Activity {
    return {
        id: crypto.randomUUID(),
        from: draft.from,
        to: draft.to,
        activity: draft.activity,
        location: draft.location,
        category: draft.category,
        dp: draft.dp,
        lifts: draft.lifts,
        pob: draft.pob,
        isFinished: true,
    };
}

function calcDuration(from: string, to: string): string {
    if (!isValidTime(from) || !isValidTime(to)) return "—";
    const diff = timeToMinutes(to) - timeToMinutes(from);
    if (diff <= 0) return "—";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function calcDurationHHMM(from: string, to: string): string {
    if (!isValidTime(from) || !isValidTime(to)) return "—";
    const diff = timeToMinutes(to) - timeToMinutes(from);
    if (diff <= 0) return "—";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function calcDurationMinutes(from: string, to: string): number {
    if (!isValidTime(from) || !isValidTime(to)) return 0;
    return Math.max(0, timeToMinutes(to) - timeToMinutes(from));
}

/* ——— Column widths for the compact table ——— */
const COL = {
    num: "w-8 text-center shrink-0",
    from: "w-[56px] shrink-0",
    to: "w-[120px] shrink-0 text-center flex justify-center",
    dur: "w-[64px] text-center shrink-0",
    activity: "flex-[2.5] min-w-[180px]",
    category: "flex-[1.5] min-w-[160px]",
    location: "flex-1 min-w-[100px]",
    dp: "w-[44px] text-center shrink-0",
    lifts: "w-[44px] text-center shrink-0",
    pob: "w-[44px] text-center shrink-0",
    action: "w-[44px] flex items-center justify-end shrink-0 pr-1",
};

/* ——— First Activity Inline Card ——— */
function FirstActivityCard({ onAdd }: { onAdd: (draft: DialogDraft) => void }) {
    const [to, setTo] = useState("");
    const [activity, setActivity] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [dp, setDp] = useState(true);
    const [lifts, setLifts] = useState("");
    const [pob, setPob] = useState("");

    const fromTime = "0000";
    const canSubmit = isValidTime(to) && timeToMinutes(to) > timeToMinutes(fromTime) && category !== "";
    const duration = calcDurationHHMM(fromTime, to);

    const handleSubmit = () => {
        if (!canSubmit) return;
        onAdd({ from: fromTime, to, activity, location, category, dp, lifts, pob });
    };

    return (
        <div className="vdr-card overflow-visible animate-fade-in border-l-2 border-primary/30">
            {/* Table header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-surface-raised/80 via-surface-raised/40 to-transparent border-b border-surface-border text-[10px] font-bold text-sky-300 uppercase tracking-widest select-none">
                <span className={COL.num}>#</span>
                <span className={COL.from}>From</span>
                <span className={COL.to}>To</span>
                <span className={COL.dur}>Duration</span>
                <span className={COL.activity}>Activity Description</span>
                <span className={COL.category}>Vessel Movement Category</span>
                <span className={COL.location}>Location</span>
                <span className={COL.dp}>DP</span>
                <span className={COL.lifts}>Lifts</span>
                <span className={COL.pob}>POB</span>
                <span className={COL.action}></span>
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2 px-3 py-1.5 relative z-30">
                {/* # — timeline node */}
                <div className={`${COL.num} flex items-center justify-center`}>
                    <span className="w-5 h-5 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary font-[family-name:var(--font-jetbrains)]">1</span>
                </div>

                {/* FROM — read-only */}
                <span className={`${COL.from} text-sm font-bold font-[family-name:var(--font-jetbrains)] text-gray-500`}>
                    00:00
                </span>

                {/* TO — TimePicker */}
                <div className={COL.to}>
                    <TimePicker value={to} onChange={setTo} minTime={fromTime} id="first-to" size="sm" />
                </div>

                {/* Duration */}
                <span className={`${COL.dur} text-xs font-bold font-[family-name:var(--font-jetbrains)] ${duration === "—" ? "text-gray-500" : "text-primary"}`}>
                    {duration}
                </span>

                {/* Activity */}
                <div className={COL.activity}>
                    <input
                        type="text"
                        value={activity}
                        onChange={(e) => setActivity(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                        placeholder="e.g. VESSEL OUTSIDE 500MZ AT BRE"
                        className="w-full bg-transparent text-xs text-foreground font-[family-name:var(--font-jetbrains)] placeholder:text-gray-600 border border-surface-border rounded px-2 py-1.5 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_6px_var(--color-primary-glow)] transition-all"
                    />
                </div>

                {/* Category */}
                <div className={COL.category}>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#1e293b] text-[11px] text-foreground border border-surface-border rounded px-1 py-1.5 focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                    >
                        <option value="" disabled>Select…</option>
                        {VESSEL_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Location */}
                <div className={COL.location}>
                    <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-[#1e293b] text-[11px] text-foreground border border-surface-border rounded px-1 py-1.5 focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                    >
                        <option value="">-</option>
                        {LOCATIONS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>

                {/* DP toggle */}
                <button
                    type="button"
                    onClick={() => setDp(!dp)}
                    className={`${COL.dp} text-xs font-extrabold rounded py-1 border cursor-pointer transition-all
                        ${dp
                            ? "bg-primary-200 text-primary border-primary-muted"
                            : "bg-warning-muted text-warning border-warning/30"
                        }`}
                >
                    {dp ? "Y" : "N"}
                </button>

                {/* Lifts */}
                <input
                    type="text"
                    inputMode="numeric"
                    value={lifts}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setLifts(v); }}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className={`${COL.lifts} bg-transparent text-xs text-center text-foreground font-[family-name:var(--font-jetbrains)] border border-surface-border rounded py-1.5 focus:outline-none focus:border-primary/50 transition-all`}
                />

                {/* POB */}
                <input
                    type="text"
                    inputMode="numeric"
                    value={pob}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setPob(v); }}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className={`${COL.pob} bg-transparent text-xs text-center text-foreground font-[family-name:var(--font-jetbrains)] border border-surface-border rounded py-1.5 focus:outline-none focus:border-primary/50 transition-all`}
                />

                {/* Checkmark (inline hint) */}
                <div className={COL.action}>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        title="Add activity"
                        className="p-1 rounded text-primary hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Prominent submit button */}
            <div className="px-3 py-2.5 border-t border-surface-border/50">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:shadow-[0_0_12px_var(--color-primary-glow)] cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Activity
                </button>
            </div>
        </div>
    );
}

/* ———————————————————————————————————————————————
   ActivityLog — compact table layout
   ——————————————————————————————————————————————— */

interface ActivityLogProps {
    onEntriesChange?: (count: number) => void;
}

export default function ActivityLog({ onEntriesChange }: ActivityLogProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogFromTime, setDialogFromTime] = useState("0000");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    /* Notify parent of logged entries count */
    React.useEffect(() => {
        if (onEntriesChange) onEntriesChange(activities.length);
    }, [activities, onEntriesChange]);

    const openDialog = useCallback((from: string) => {
        setDialogFromTime(from);
        setDialogOpen(true);
        setConfirmDeleteId(null);
    }, []);

    const handleAdd = useCallback((draft: DialogDraft) => {
        setActivities(prev => [...prev, createActivity(draft)]);
    }, []);

    const handleDialogComplete = useCallback((draft: DialogDraft) => {
        setActivities(prev => [...prev, createActivity(draft)]);
        setDialogOpen(false);
    }, []);

    /* Removes the clicked entry and all entries that follow */
    const removeFrom = useCallback((id: string) => {
        setActivities(prev => {
            const idx = prev.findIndex(a => a.id === id);
            if (idx === -1) return prev;
            return prev.slice(0, idx);
        });
        setConfirmDeleteId(null);
    }, []);

    const totalMinutes = useMemo(
        () => activities.reduce((sum, a) => sum + calcDurationMinutes(a.from, a.to), 0),
        [activities]
    );

    const lastTo = activities[activities.length - 1]?.to ?? "";
    const dayComplete = lastTo === "2400";

    return (
        <div className="space-y-4">
            {/* EMPTY STATE — inline first-activity card */}
            {activities.length === 0 ? (
                <div className="relative pt-8 mt-4">
                    {/* Section Title */}
                    <div className="text-center mb-4">
                        <h2 className="text-base font-extrabold text-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                            Daily Operations Activity Log
                        </h2>
                    </div>
                    <FirstActivityCard onAdd={handleAdd} />
                </div>

            ) : (
                /* COMPACT TABLE — timeline with header, entries */
                <div className="relative mt-6">

                    {/* Header bar: title + entries count */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-extrabold text-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                            Daily Operations Activity Log
                        </h2>

                        <div className="flex items-center gap-2 bg-surface-raised px-4 py-2 rounded-lg border border-surface-border shrink-0">
                            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Entries</span>
                            <span className="font-bold text-primary text-lg leading-none font-[family-name:var(--font-jetbrains)]">
                                {activities.length}
                            </span>
                        </div>
                    </div>

                    {/* Compact table */}
                    <div className="vdr-card overflow-hidden border-l-2 border-primary/30">
                        {/* Table header */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-surface-raised/80 via-surface-raised/40 to-transparent border-b border-surface-border text-[10px] font-bold text-sky-300 uppercase tracking-widest select-none">
                            <span className={COL.num}>#</span>
                            <span className={COL.from}>From</span>
                            <span className={COL.to}>To</span>
                            <span className={COL.dur}>Duration</span>
                            <span className={COL.activity}>Activity Description</span>
                            <span className={COL.category}>Vessel Movement Category</span>
                            <span className={COL.location}>Location</span>
                            <span className={COL.dp}>DP</span>
                            <span className={COL.lifts}>Lifts</span>
                            <span className={COL.pob}>POB</span>
                            <span className={COL.action}></span>
                        </div>

                        {/* Rows */}
                        {activities.map((a, idx) => {
                            const duration = calcDurationHHMM(a.from, a.to);
                            const isConfirming = confirmDeleteId === a.id;
                            const entriesAfter = activities.length - idx - 1;

                            return (
                                <div key={a.id} className="animate-fade-in">
                                    {/* Delete confirmation */}
                                    {isConfirming && (
                                        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-danger-muted border-b border-danger/30 animate-fade-in">
                                            <p className="text-xs font-bold text-danger">
                                                Remove this entry{entriesAfter > 0 ? ` + ${entriesAfter} following` : ""}?
                                            </p>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button type="button" onClick={() => setConfirmDeleteId(null)}
                                                    className="px-2.5 py-1 text-[10px] font-bold border border-surface-border text-gray-400 rounded-md hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer">
                                                    Cancel
                                                </button>
                                                <button type="button" onClick={() => removeFrom(a.id)}
                                                    className="px-2.5 py-1 text-[10px] font-bold bg-danger/20 text-danger border border-danger/40 rounded-md hover:bg-danger/30 transition-all cursor-pointer">
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Data row */}
                                    <div className={`group flex items-center gap-2 px-3 py-1.5 border-b border-surface-border/50 hover:bg-surface-hover/50 hover:shadow-[inset_4px_0_0_var(--color-primary)] transition-all ${isConfirming ? "opacity-50" : ""}`}>
                                        {/* # — timeline node */}
                                        <div className={`${COL.num} relative flex items-center justify-center`}>
                                            {idx > 0 && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1/2 bg-primary/25" />}
                                            {idx < activities.length - 1 && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-1/2 bg-primary/25" />}
                                            <span className="relative z-10 w-5 h-5 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary font-[family-name:var(--font-jetbrains)]">
                                                {idx + 1}
                                            </span>
                                        </div>

                                        {/* From */}
                                        <span className={`${COL.from} text-sm font-bold font-[family-name:var(--font-jetbrains)] text-foreground`}>
                                            {a.from.slice(0, 2)}:{a.from.slice(2)}
                                        </span>

                                        {/* To */}
                                        <span className={`${COL.to} text-sm font-bold font-[family-name:var(--font-jetbrains)] text-foreground`}>
                                            {a.to.slice(0, 2)}:{a.to.slice(2)}
                                        </span>

                                        {/* Duration */}
                                        <span className={`${COL.dur} text-xs font-bold font-[family-name:var(--font-jetbrains)] text-primary`}>
                                            {duration}
                                        </span>

                                        {/* Activity */}
                                        <div className={`${COL.activity} truncate`}>
                                            {a.activity ? (
                                                <span className="text-xs font-[family-name:var(--font-jetbrains)] text-foreground">{a.activity}</span>
                                            ) : (
                                                <span className="text-xs text-gray-500 italic">—</span>
                                            )}
                                        </div>

                                        {/* Category */}
                                        <div className={`${COL.category} truncate`}>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary max-w-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_4px_var(--color-primary-glow)]" />
                                                <span className="truncate">{a.category}</span>
                                            </span>
                                        </div>

                                        {/* Location */}
                                        <span className={`${COL.location} text-xs text-gray-300 truncate`}>
                                            {a.location || "-"}
                                        </span>

                                        {/* DP */}
                                        <span className={`${COL.dp} text-xs font-extrabold ${a.dp ? "text-primary" : "text-warning"}`}>
                                            {a.dp ? "Y" : "N"}
                                        </span>

                                        {/* Lifts */}
                                        <span className={`${COL.lifts} text-xs font-bold font-[family-name:var(--font-jetbrains)] text-foreground`}>
                                            {a.lifts || "0"}
                                        </span>

                                        {/* POB */}
                                        <span className={`${COL.pob} text-xs font-bold font-[family-name:var(--font-jetbrains)] text-foreground`}>
                                            {a.pob || "0"}
                                        </span>

                                        {/* Delete */}
                                        <div className={COL.action}>
                                            {!isConfirming && (
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeleteId(a.id)}
                                                    title={entriesAfter > 0 ? `Remove this and ${entriesAfter} subsequent` : "Remove this entry"}
                                                    className="p-1 text-gray-600 hover:text-danger rounded-md hover:bg-danger-muted transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                    aria-label="Delete entry"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Next Activity / Day Complete */}
                    <div className="mt-3">
                        {dayComplete || totalMinutes >= 1440 ? (
                            <div className="flex items-center gap-2 py-2 px-3 text-sm font-semibold text-success">
                                <span className="w-2 h-2 rounded-full bg-success animate-glow-pulse" />
                                24 hours completed for this day.
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openDialog(lastTo)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:shadow-[0_0_12px_var(--color-primary-glow)] cursor-pointer transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                + Add Activity
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Wizard Dialog */}
            {dialogOpen && (
                <ActivityDialog
                    fromTime={dialogFromTime}
                    isFirst={activities.length === 0}
                    onComplete={handleDialogComplete}
                    onClose={() => setDialogOpen(false)}
                />
            )}
        </div>
    );
}
