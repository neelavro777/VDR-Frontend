"use client";

import React, { useState, useCallback, useMemo } from "react";
import { isValidTime, timeToMinutes } from "./TimePicker";
import ProgressRing from "./ProgressRing";
import ActivityDialog, { type DialogDraft } from "./ActivityDialog";

interface Activity {
    id: string;
    from: string;
    to: string;
    activity: string;
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
    return `${h}h ${m}m`;
}

function calcDurationMinutes(from: string, to: string): number {
    if (!isValidTime(from) || !isValidTime(to)) return 0;
    return Math.max(0, timeToMinutes(to) - timeToMinutes(from));
}

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
        <div className="space-y-6">
            {/* EMPTY STATE — no clock, no header */}
            {activities.length === 0 ? (
                <div className="relative pt-8 mt-4">
                    {/* Section Title */}
                    <div className="text-center mb-2">
                        <h2 className="text-base font-extrabold text-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                            Daily Operations Activity Log
                        </h2>
                    </div>
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <div className="w-20 h-20 rounded-full bg-surface-raised border-2 border-dashed border-surface-border flex items-center justify-center">
                            <svg className="w-9 h-9 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-foreground mb-2">No activities logged yet</h3>
                            <p className="text-sm text-gray-400 max-w-xs">
                                Start recording today&apos;s vessel operations by adding your first activity
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => openDialog("0000")}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-primary/20 text-primary border-2 border-primary rounded-2xl font-bold text-base hover:bg-primary/30 hover:shadow-[0_0_20px_var(--color-primary-glow)] transition-all cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add First Activity
                        </button>
                    </div>
                </div>

            ) : (
                /* TIMELINE — with clock, header, entries */
                <div className="relative pt-16 mt-4">

                    {/* Progress Ring */}
                    <div
                        className="absolute z-20 flex items-center justify-center bg-surface rounded-full shadow-xl"
                        style={{ width: 84, height: 84, left: -20, top: -20 }}
                    >
                        <ProgressRing current={totalMinutes} total={1440} dayComplete={dayComplete} />
                    </div>

                    {/* Section Title */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-[-8px] z-20">
                        <h2 className="text-base font-extrabold text-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                            Daily Operations Activity Log
                        </h2>
                    </div>

                    {/* Entries Count */}
                    <div className="absolute right-0 top-0 z-20 flex items-center gap-3 bg-surface-raised px-5 py-2.5 rounded-xl border border-surface-border shadow-lg">
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-xs">Entries logged</span>
                        <span className="font-bold text-primary text-xl leading-none font-[family-name:var(--font-jetbrains)]">
                            {activities.length}
                        </span>
                    </div>

                    {/* Timeline rail */}
                    <div className="absolute left-5 top-[60px] bottom-0 w-px bg-surface-border" />

                    <div className="space-y-4">
                        {activities.map((a, idx) => {
                            const duration = calcDuration(a.from, a.to);
                            const isConfirming = confirmDeleteId === a.id;
                            const entriesAfter = activities.length - idx - 1;

                            return (
                                <div key={a.id} className="relative pl-12 animate-fade-in">
                                    {/* Timeline dot */}
                                    <div className="absolute left-3 top-[22px] w-5 h-5 rounded-full border-2 border-primary bg-primary-50 shadow-[0_0_8px_var(--color-primary-glow)] flex items-center justify-center z-10">
                                        <span className="text-[8px] font-bold font-[family-name:var(--font-jetbrains)] text-gray-400">
                                            {idx + 1}
                                        </span>
                                    </div>

                                    {/* Summary Card */}
                                    <div className={`vdr-card p-5 transition-all duration-200 group ${isConfirming ? "border-danger/50 shadow-[0_0_12px_rgba(248,113,113,0.08)]" : "hover:border-gray-300"}`}>

                                        {/* Delete confirmation banner */}
                                        {isConfirming && (
                                            <div className="flex items-center justify-between gap-4 mb-4 px-4 py-3 rounded-xl bg-danger-muted border border-danger/30 animate-fade-in">
                                                <div>
                                                    <p className="text-sm font-bold text-danger">
                                                        Remove this entry{entriesAfter > 0 ? ` and ${entriesAfter} following ${entriesAfter === 1 ? "entry" : "entries"}` : ""}?
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone.</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button type="button" onClick={() => setConfirmDeleteId(null)}
                                                        className="px-3 py-1.5 text-xs font-bold border border-surface-border text-gray-400 rounded-lg hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer">
                                                        Cancel
                                                    </button>
                                                    <button type="button" onClick={() => removeFrom(a.id)}
                                                        className="px-3 py-1.5 text-xs font-bold bg-danger/20 text-danger border border-danger/40 rounded-lg hover:bg-danger/30 transition-all cursor-pointer">
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Row 1: time range + duration + badges + delete */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-foreground">
                                                        {a.from.slice(0, 2)}:{a.from.slice(2)}
                                                    </span>
                                                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                    <span className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-foreground">
                                                        {a.to.slice(0, 2)}:{a.to.slice(2)}
                                                    </span>
                                                </div>
                                                <span className="px-3 py-1 bg-primary-100 border border-primary-muted rounded-lg text-sm font-bold font-[family-name:var(--font-jetbrains)] text-primary shadow-[0_0_6px_var(--color-primary-glow)]">
                                                    {duration}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border shadow-[0_0_6px_var(--color-primary-glow)] ${a.dp ? "bg-primary-100 border-primary-muted text-primary" : "bg-warning-muted border-warning/30 text-warning !shadow-[0_0_6px_rgba(251,191,36,0.2)]"}`}>
                                                    DP: {a.dp ? "Y" : "N"}
                                                </span>
                                                <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary-100 border border-primary-muted text-primary shadow-[0_0_6px_var(--color-primary-glow)]">
                                                    Lifts: {a.lifts || "0"}
                                                </span>
                                                <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary-100 border border-primary-muted text-primary shadow-[0_0_6px_var(--color-primary-glow)]">
                                                    POB: {a.pob || "0"}
                                                </span>
                                                {!isConfirming && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeleteId(a.id)}
                                                        title={entriesAfter > 0 ? `Remove this and ${entriesAfter} subsequent ${entriesAfter === 1 ? "entry" : "entries"}` : "Remove this entry"}
                                                        className="p-1.5 ml-1 text-gray-500 hover:text-danger rounded-lg hover:bg-danger-muted transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                        aria-label="Delete entry"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="my-3 border-t border-surface-border" />

                                        {/* Row 2: activity text + category badge */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                {a.activity ? (
                                                    <p className="text-sm font-semibold font-[family-name:var(--font-jetbrains)] text-white truncate">
                                                        {a.activity}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No activity description</p>
                                                )}
                                            </div>
                                            <div className="shrink-0">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-muted rounded-lg text-sm font-bold text-primary shadow-[0_0_6px_var(--color-primary-glow)] max-w-[260px]">
                                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_5px_var(--color-primary-glow)]" />
                                                    <span className="truncate">{a.category}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add Next Activity / Day Complete */}
                        <div className="relative pl-12">
                            <div className="absolute left-3 top-3.5 w-5 h-5 rounded-full border-2 border-dashed border-surface-border bg-surface flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>

                            {dayComplete || totalMinutes >= 1440 ? (
                                <div className="flex items-center gap-2 py-3 px-4 text-sm font-semibold text-success">
                                    <span className="w-2 h-2 rounded-full bg-success animate-glow-pulse" />
                                    24 hours completed for this day.
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => openDialog(lastTo)}
                                    className="inline-flex items-center gap-2 px-6 py-4 text-base font-semibold rounded-xl border-2 border-dashed transition-all duration-200 border-primary/40 text-primary hover:bg-primary-50 hover:border-primary hover:shadow-[0_0_16px_var(--color-primary-glow)] cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Next Activity
                                </button>
                            )}
                        </div>
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
