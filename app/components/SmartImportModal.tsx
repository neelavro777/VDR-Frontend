"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import SearchableDropdown from "./SearchableDropdown";
import { NATIONALITIES } from "./CrewTable";

/* ═══════════════════════════════════════════════════════════════
   FUZZY ALIAS MAP — maps messy Excel headers to our columns
   ═══════════════════════════════════════════════════════════════ */
const ALIAS_MAP: Record<string, string[]> = {
    "Name": [
        "name", "full name", "crew name", "mariner", "seafarer",
        "employee", "employee name", "personnel", "person", "crew",
        "first name", "worker", "staff name", "fullname",
    ],
    "Rank": [
        "rank", "position", "title", "designation", "role",
        "job title", "job", "crew rank", "post",
    ],
    "Vendor": [
        "vendor", "company", "contractor", "supplier", "firm",
        "agency", "employer", "company name", "vendor name",
    ],
    "Age": [
        "age", "years old", "years", "dob", "date of birth"
    ],
    "Nationality": [
        "nationality", "country", "citizenship", "nation",
        "flag state", "national", "country of origin",
    ],
    "IC or Passport No.": [
        "ic or passport no", "ic or passport no.", "passport", "ic",
        "id no", "id no.", "identity", "document no", "document no.",
        "ic number", "ic no", "ic no.", "passport number", "passport no",
        "passport no.", "id", "id number", "identification",
        "travel document", "document number", "nric", "nric no", "nric no."
    ],
    "Date Sign-on (DD/MM/YYYY)": [
        "date sign-on", "date sign on", "sign on", "sign-on",
        "sign on date", "sign-on date", "embarkation", "embarkation date",
        "joining date", "start date", "date joined", "date of joining",
        "onboard date", "boarding date", "signon", "signon date"
    ],
    "No. of working days": [
        "no. of working days", "no of working days", "working days",
        "days worked", "tenure", "service days", "days on board",
        "days onboard", "days", "work days", "duration"
    ],
    "Comments": [
        "comments", "remarks", "notes", "observations", "comment",
        "remark", "note", "additional info",
    ],
};

function fuzzyMatchColumn(header: string): string | null {
    const normalized = header.toLowerCase().trim().replace(/[_\-\.]+/g, " ").replace(/\s+/g, " ");
    if (!normalized) return null;

    // Pass 1: Exact alias match
    for (const [target, aliases] of Object.entries(ALIAS_MAP)) {
        if (aliases.includes(normalized)) return target;
    }

    // Pass 2: Substring containment (both directions)
    for (const [target, aliases] of Object.entries(ALIAS_MAP)) {
        for (const alias of aliases) {
            if (normalized.includes(alias) || alias.includes(normalized)) return target;
        }
    }

    return null;
}

// Convert DD/MM/YYYY to YYYY-MM-DD for date input
function toISODate(localDate: string) {
    if (!localDate) return "";
    const parts = localDate.split("/");
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    const d = new Date(localDate);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
    }
    return "";
}

// Convert YYYY-MM-DD to DD/MM/YYYY for storage
function fromISODate(iso: string) {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiredColumns: string[];
    onImport: (rows: Record<string, string>[]) => void;
}

export default function SmartImportModal({
    isOpen, onClose, requiredColumns, onImport,
}: SmartImportModalProps) {
    const [rawText, setRawText] = useState("");
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
    const [stats, setStats] = useState({ pastedRows: 0, mappedCols: 0 });

    const dropzoneRef = useRef<HTMLDivElement>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setRawText("");
            setPreviewData([]);
            setStats({ pastedRows: 0, mappedCols: 0 });
            setTimeout(() => {
                dropzoneRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    /* ——— Paste Handling ——— */
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData("text/plain");
        setRawText(text);

        // Parse TSV
        if (!text.trim()) {
            setPreviewData([]);
            return;
        }

        const lines = text.split(/\r?\n/);
        const rows = lines
            .map((line) => line.split("\t"))
            .filter((row) => row.some((cell) => cell.trim().length > 0)); // Filter blank rows

        if (rows.length < 2) return;

        const headers = rows[0];
        const mapping: Record<number, string> = {};
        const mappedSet = new Set<string>();

        // Fuzzy match logic
        headers.forEach((h, i) => {
            const match = fuzzyMatchColumn(h);
            if (match && requiredColumns.includes(match) && !mappedSet.has(match)) {
                mapping[i] = match;
                mappedSet.add(match);
            }
        });

        // Build data
        const dataRows = rows.slice(1).map(cells => {
            const rowObj: Record<string, string> = {};
            requiredColumns.forEach(c => rowObj[c] = "");

            cells.forEach((cellVal, colIndex) => {
                const mappedCol = mapping[colIndex];
                if (mappedCol) {
                    rowObj[mappedCol] = cellVal.trim();
                }
            });
            return rowObj;
        }).filter(row => Object.values(row).some(val => val.trim().length > 0));

        setStats({ pastedRows: dataRows.length, mappedCols: mappedSet.size });
        setPreviewData(dataRows);
        e.preventDefault();
    }, [requiredColumns]);

    /* ——— UI Change ——— */
    const updateCell = useCallback((rowIdx: number, colName: string, value: string) => {
        setPreviewData(prev => prev.map((row, i) =>
            i === rowIdx ? { ...row, [colName]: value } : row
        ));
    }, []);

    /* ——— Import Action ——— */
    const handleImport = useCallback(() => {
        onImport(previewData);
        onClose();
    }, [previewData, onImport, onClose]);

    if (!isOpen) return null;

    // Calculate missing fields (Excluding Comments, which is purely optional)
    const requiredKeys = requiredColumns.filter(c => c !== "Comments");
    const totalMissing = previewData.reduce((acc, row) => {
        return acc + requiredKeys.filter(col => !row[col]?.trim()).length;
    }, 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-surface-border overflow-hidden flex flex-col mx-4 animate-fade-in">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-raised shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Smart Import
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Paste data directly from Excel — Columns are automatically mapped using AI
                        </p>
                    </div>
                    <button
                        type="button" onClick={onClose}
                        className="p-2 text-gray-400 hover:text-foreground hover:bg-surface-hover rounded-lg transition-all duration-150 cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto bg-[#0b101e]">
                    {previewData.length === 0 ? (
                        /* ─── The Input Area ─── */
                        <div className="flex flex-col items-center justify-center p-8 h-full min-h-[400px]">
                            <div
                                tabIndex={0}
                                ref={dropzoneRef}
                                onPaste={handlePaste}
                                className="w-full max-w-3xl h-80 flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl bg-surface-raised cursor-text
                                    hover:border-primary-muted focus:border-primary focus:shadow-[0_0_24px_var(--color-primary-glow)] focus:bg-surface focus:outline-none
                                    transition-all duration-200 group"
                            >
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-surface-hover group-focus:bg-primary-500/10 transition-colors">
                                    <svg className="w-8 h-8 text-gray-400 group-focus:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                                    Paste Excel data here
                                </p>
                                <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface border border-surface-border shadow-inner text-sm font-[family-name:var(--font-jetbrains)] text-gray-300">
                                    <span className="font-bold text-foreground">Ctrl</span> + <span className="font-bold text-foreground">V</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Click anywhere in this box to focus, then paste
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* ─── Preview Table ─── */
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Mapped Columns Preview
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => { setPreviewData([]); setRawText(""); }}
                                    className="text-xs text-primary hover:text-primary-hover underline underline-offset-2 transition-colors cursor-pointer font-bold uppercase tracking-wider"
                                >
                                    ← Start over with new data
                                </button>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span className="text-foreground font-bold">{stats.pastedRows} rows parsed</span>
                                <span>•</span>
                                <span className={stats.mappedCols === requiredColumns.length ? "text-success font-bold" : "text-warning font-bold"}>
                                    {stats.mappedCols} / {requiredColumns.length} columns identified
                                </span>
                            </div>

                            <div className="overflow-x-auto pb-4 rounded-xl border border-surface-border shadow-xl bg-surface 
                                [&::-webkit-scrollbar]:h-[18px] [&::-webkit-scrollbar-track]:bg-surface-raised [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white [&::-webkit-scrollbar-thumb]:rounded-full">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#1e293b]">
                                        <tr>
                                            <th className="px-4 py-3 text-left w-12 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-surface-border">#</th>
                                            {requiredColumns.map(col => (
                                                <th key={col} className="px-3 py-3 text-left border-b border-surface-border">
                                                    <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary-900/20 px-2.5 py-1 rounded">
                                                        {col === "Date Sign-on (DD/MM/YYYY)" ? "Sign-on Date" : col}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-border/50">
                                        {previewData.slice(0, 50).map((row, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-surface-hover/30 transition-colors relative" style={{ zIndex: 100 - rowIdx }}>
                                                <td className="px-4 py-2 text-xs font-bold text-gray-600 font-[family-name:var(--font-jetbrains)]">{rowIdx + 1}</td>
                                                {requiredColumns.map(col => {
                                                    const val = row[col] || "";
                                                    const isRequired = col !== "Comments";
                                                    const isMissing = isRequired && !val.trim();
                                                    const isDate = col === "Date Sign-on (DD/MM/YYYY)";

                                                    return (
                                                        <td key={col} className={`px-2 py-1.5 align-top ${col === "Name" ? "min-w-[250px]"
                                                            : col === "Comments" ? "min-w-[300px]"
                                                                : col === "Nationality" ? "min-w-[220px]"
                                                                    : "min-w-[140px]"
                                                            }`}>
                                                            {isDate ? (
                                                                <input
                                                                    type="date"
                                                                    value={toISODate(val)}
                                                                    onChange={(e) => updateCell(rowIdx, col, fromISODate(e.target.value))}
                                                                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none transition-all duration-150 font-[family-name:var(--font-jetbrains)]
                                                                        bg-surface text-foreground color-scheme-dark
                                                                        ${isMissing
                                                                            ? "border-danger focus:border-danger focus:shadow-[0_0_8px_rgba(248,113,113,0.3)] bg-danger-muted/30 text-danger"
                                                                            : "border-surface-border focus:border-primary focus:shadow-[0_0_8px_var(--color-primary-glow)]"
                                                                        }`}
                                                                />
                                                            ) : col === "Nationality" ? (
                                                                <div className="relative z-50">
                                                                    <SearchableDropdown
                                                                        options={NATIONALITIES}
                                                                        value={val}
                                                                        onChange={(v) => updateCell(rowIdx, col, v)}
                                                                        placeholder={isMissing ? "Missing Nationality" : "Select nationality..."}
                                                                        id={`import-${rowIdx}-nat`}
                                                                        error={isMissing}
                                                                    />
                                                                </div>
                                                            ) : col === "Name" || col === "Comments" ? (
                                                                <textarea
                                                                    value={val}
                                                                    onChange={(e) => updateCell(rowIdx, col, e.target.value)}
                                                                    placeholder={isMissing ? "Missing" : ""}
                                                                    rows={1}
                                                                    onInput={(e) => {
                                                                        const target = e.target as HTMLTextAreaElement;
                                                                        target.style.height = 'auto';
                                                                        target.style.height = `${target.scrollHeight}px`;
                                                                    }}
                                                                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none transition-all duration-150 font-[family-name:var(--font-jetbrains)] resize-none overflow-hidden
                                                                        bg-surface text-foreground leading-relaxed
                                                                        ${isMissing
                                                                            ? "border-danger placeholder-danger/60 focus:border-danger focus:shadow-[0_0_8px_rgba(248,113,113,0.3)] bg-danger-muted/30 text-danger"
                                                                            : "border-surface-border focus:border-primary focus:shadow-[0_0_8px_var(--color-primary-glow)]"
                                                                        }`}
                                                                />
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={val}
                                                                    onChange={(e) => updateCell(rowIdx, col, e.target.value)}
                                                                    placeholder={isMissing ? "Missing" : ""}
                                                                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none transition-all duration-150 font-[family-name:var(--font-jetbrains)]
                                                                        bg-surface text-foreground
                                                                        ${isMissing
                                                                            ? "border-danger placeholder-danger/60 focus:border-danger focus:shadow-[0_0_8px_rgba(248,113,113,0.3)] bg-danger-muted/30 text-danger"
                                                                            : "border-surface-border focus:border-primary focus:shadow-[0_0_8px_var(--color-primary-glow)]"
                                                                        }`}
                                                                />
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {previewData.length > 50 && (
                                <p className="text-xs text-center text-gray-500 font-bold tracking-wider uppercase mt-4">
                                    Displaying first 50 rows. All {previewData.length} rows will be imported.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {previewData.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border bg-surface-raised shrink-0">
                        <div className="text-xs flex items-center gap-4">
                            {totalMissing > 0 ? (
                                <div className="flex flex-col gap-1">
                                    <span className="text-warning flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] bg-warning-muted/30 px-3 py-1.5 rounded-full border border-warning/20 w-fit">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        {totalMissing} required records missing
                                    </span>
                                    <span className="text-gray-500 italic text-[11px]">
                                        * You can fill them above or import now and complete them in the crew view later.
                                    </span>
                                </div>
                            ) : (
                                <span className="text-success flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] bg-success-muted/30 px-3 py-1.5 rounded-full border border-success/20 w-fit">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    All required fields populated perfectly!
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button" onClick={onClose}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white hover:bg-surface-hover rounded-lg transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleImport}
                                className="px-6 py-2.5 text-sm font-bold text-gray-50 bg-primary hover:bg-primary-hover rounded-lg transition-all duration-200 hover:shadow-[0_0_16px_var(--color-primary-glow)] cursor-pointer flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Import Data
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
