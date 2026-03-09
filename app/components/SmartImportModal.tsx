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
        "first name", "worker", "staff name", "fullname", "first name", "last name",
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

// Custom TSV parser to handle Excel's quoted cells containing newlines
function parseTSV(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentCell += '"'; // escaped quote
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === '\t') {
                currentRow.push(currentCell);
                currentCell = '';
            } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
                if (char === '\r') i++;
            } else {
                currentCell += char;
            }
        }
    }
    currentRow.push(currentCell);

    // Filter out completely empty rows
    return rows.filter(row => row.some(cell => cell && cell.trim().length > 0));
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
    const [pastedHeaders, setPastedHeaders] = useState<string[]>([]);
    const [pastedRows, setPastedRows] = useState<string[][]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<number, string>>({}); // mapped from colIndex -> requiredColumnName
    const [stats, setStats] = useState({ pastedRows: 0, mappedCols: 0 });

    const dropzoneRef = useRef<HTMLDivElement>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setRawText("");
            setPastedHeaders([]);
            setPastedRows([]);
            setColumnMapping({});
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
            setPastedHeaders([]);
            setPastedRows([]);
            return;
        }

        const rows = parseTSV(text);

        if (rows.length < 2) return;

        // Identify columns to drop (strict match for 'No.', '#', etc.)
        const rawHeaders = rows[0].map(h => h.trim());
        const colsToDrop = new Set<number>();
        rawHeaders.forEach((h, idx) => {
            const lowerH = h.toLowerCase().replace(/[\r\n]+/g, '');
            if (lowerH === "no." || lowerH === "no" || lowerH === "#" || lowerH === "s/n" || lowerH === "serial no." || lowerH === "serial no") {
                colsToDrop.add(idx);
            }
        });

        // Filter out those columns from headers and rows
        const headers = rawHeaders.filter((_, idx) => !colsToDrop.has(idx));
        const dataRows = rows.slice(1).map(row => row.filter((_, idx) => !colsToDrop.has(idx)));

        const mapping: Record<number, string> = {};
        let mappedCount = 0;

        // Auto-guess fuzzy matches
        headers.forEach((h, i) => {
            const match = fuzzyMatchColumn(h);
            if (match && requiredColumns.includes(match) && !Object.values(mapping).includes(match)) {
                mapping[i] = match;
                mappedCount++;
            }
        });

        setPastedHeaders(headers);
        setPastedRows(dataRows);
        setColumnMapping(mapping);
        setStats({ pastedRows: dataRows.length, mappedCols: mappedCount });
        e.preventDefault();
    }, [requiredColumns]);

    /* ——— UI Change ——— */
    const updateCell = useCallback((rowIdx: number, colIdx: number, value: string) => {
        setPastedRows(prev => prev.map((row, i) =>
            i === rowIdx ? row.map((cell, j) => j === colIdx ? value : cell) : row
        ));
    }, []);

    const updateMapping = useCallback((colIdx: number, reqCol: string) => {
        setColumnMapping(prev => {
            const next = { ...prev };
            // Optional: If this reqCol is already mapped elsewhere, clear it there? (Strict 1:1)
            // Let's do strict 1:1 for required columns. If user selects Name for col 3, and Name was on col 1, col 1 becomes unassigned
            if (reqCol !== "") {
                for (const k in next) {
                    if (next[k] === reqCol) delete next[k];
                }
                next[colIdx] = reqCol;
            } else {
                delete next[colIdx];
            }
            // Update stats
            setStats(s => ({ ...s, mappedCols: Object.keys(next).length }));
            return next;
        });
    }, []);

    /* ——— Import Action ——— */
    const handleImport = useCallback(() => {
        const mappedData = pastedRows.map(rowCells => {
            const rowObj: Record<string, string> = {};
            // Initialize required cols to empty string
            requiredColumns.forEach(c => rowObj[c] = "");

            // Map values from the grid
            Object.entries(columnMapping).forEach(([colIdxStr, reqCol]) => {
                const colIdx = parseInt(colIdxStr, 10);
                if (rowCells[colIdx]) {
                    rowObj[reqCol] = rowCells[colIdx].trim();
                }
            });
            return rowObj;
        }).filter(row => Object.values(row).some(val => val.trim().length > 0));

        onImport(mappedData);
        onClose();
    }, [pastedRows, columnMapping, requiredColumns, onImport, onClose]);

    if (!isOpen) return null;

    // Calculate missing fields (Excluding Comments, which is purely optional)
    const requiredKeys = requiredColumns.filter(c => c !== "Comments");
    const totalMissing = pastedRows.reduce((acc, rowCells) => {
        let missingCount = 0;
        requiredKeys.forEach(reqCol => {
            // Find which column index is mapped to this required column
            const mappedIdxStr = Object.keys(columnMapping).find(k => columnMapping[parseInt(k, 10)] === reqCol);
            if (!mappedIdxStr) {
                missingCount++; // Entire column is unmapped/missing
            } else {
                const val = rowCells[parseInt(mappedIdxStr, 10)];
                if (!val || !val.trim()) missingCount++;
            }
        });
        return acc + missingCount;
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
                            Paste data directly from Excel — Columns are automatically mapped
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
                    {pastedRows.length === 0 ? (
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
                                    onClick={() => { setPastedRows([]); setPastedHeaders([]); setRawText(""); setColumnMapping({}); }}
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
                                            {pastedHeaders.map((header, colIdx) => {
                                                const mappedReq = columnMapping[colIdx] || "";
                                                const isUnmapped = !mappedReq;
                                                // Dynamic min-width based on mapped column type to prevent cutoff
                                                let minWidthClass = "min-w-[180px]";
                                                if (mappedReq === "Name") minWidthClass = "min-w-[250px]";
                                                if (mappedReq === "Comments") minWidthClass = "min-w-[300px]";
                                                if (mappedReq === "Nationality") minWidthClass = "min-w-[220px]";

                                                return (
                                                    <th key={colIdx} className={`px-3 py-3 text-left border-b border-r border-surface-border ${minWidthClass} ${isUnmapped ? "bg-surface-raised" : "bg-primary-900/10"}`}>
                                                        <div className="flex flex-col gap-2.5">
                                                            {/* Original pasted header */}
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate" title={header}>
                                                                Excel Column: <span className="text-white ml-1">{header.replace(/[\r\n]+/g, ' ') || `Column ${colIdx + 1}`}</span>
                                                            </div>
                                                            {/* Mapping dropdown */}
                                                            <div className="relative">
                                                                <select
                                                                    value={mappedReq}
                                                                    onChange={(e) => updateMapping(colIdx, e.target.value)}
                                                                    className={`w-full text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg outline-none border transition-colors cursor-pointer appearance-none ${isUnmapped
                                                                        ? "bg-surface border-surface-border hover:border-gray-500 text-gray-500"
                                                                        : "bg-primary-900/20 text-primary border-primary/40 hover:border-primary/80"
                                                                        }`}
                                                                    style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${isUnmapped ? '94a3b8' : '38bdf8'}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem top 50%', backgroundSize: '.65rem auto', paddingRight: '2rem' }}
                                                                >
                                                                    <option value="" className="bg-surface text-gray-400">-- Ignore --</option>
                                                                    {requiredColumns.map(rc => (
                                                                        <option key={rc} value={rc} className="bg-surface text-foreground">{rc === "Date Sign-on (DD/MM/YYYY)" ? "Sign-on Date" : rc}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-border/50">
                                        {pastedRows.slice(0, 50).map((rowCells, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-surface-hover/30 transition-colors relative" style={{ zIndex: 100 - rowIdx }}>
                                                <td className="px-4 py-2 text-xs font-bold text-gray-600 font-[family-name:var(--font-jetbrains)]">{rowIdx + 1}</td>
                                                {pastedHeaders.map((_, colIdx) => {
                                                    const val = rowCells[colIdx] || "";
                                                    const mappedReq = columnMapping[colIdx];
                                                    const isRequired = mappedReq && mappedReq !== "Comments";
                                                    const isMissing = isRequired && !val.trim();
                                                    const isDate = mappedReq === "Date Sign-on (DD/MM/YYYY)";

                                                    return (
                                                        <td key={colIdx} className="px-2 py-1.5 align-top border-r border-surface-border/20">
                                                            {isDate ? (
                                                                <input
                                                                    type="date"
                                                                    value={toISODate(val)}
                                                                    onChange={(e) => updateCell(rowIdx, colIdx, fromISODate(e.target.value))}
                                                                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none transition-all duration-150 font-[family-name:var(--font-jetbrains)]
                                                                        bg-surface text-foreground color-scheme-dark
                                                                        ${isMissing
                                                                            ? "border-danger focus:border-danger focus:shadow-[0_0_8px_rgba(248,113,113,0.3)] bg-danger-muted/30 text-danger"
                                                                            : mappedReq ? "border-surface-border focus:border-primary focus:shadow-[0_0_8px_var(--color-primary-glow)]"
                                                                                : "border-transparent bg-transparent text-gray-500 hover:border-surface-border"
                                                                        }`}
                                                                />
                                                            ) : mappedReq === "Nationality" ? (
                                                                <div className="relative z-50">
                                                                    <SearchableDropdown
                                                                        options={NATIONALITIES}
                                                                        value={val}
                                                                        onChange={(v) => updateCell(rowIdx, colIdx, v)}
                                                                        placeholder={isMissing ? "Missing Nationality" : "Select nationality..."}
                                                                        id={`import-${rowIdx}-${colIdx}-nat`}
                                                                        error={!!isMissing}
                                                                    />
                                                                </div>
                                                            ) : mappedReq === "Name" || mappedReq === "Comments" ? (
                                                                <textarea
                                                                    value={val}
                                                                    onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                                                                    placeholder={isMissing ? "Missing" : (mappedReq ? "" : "Ignored")}
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
                                                                            : mappedReq ? "border-surface-border focus:border-primary focus:shadow-[0_0_8px_var(--color-primary-glow)]"
                                                                                : "border-transparent bg-transparent text-gray-500 hover:border-surface-border"
                                                                        }`}
                                                                />
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={val}
                                                                    onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                                                                    placeholder={isMissing ? "Missing" : (mappedReq ? "" : "Ignored")}
                                                                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none transition-all duration-150 font-[family-name:var(--font-jetbrains)]
                                                                        bg-surface text-foreground
                                                                        ${isMissing
                                                                            ? "border-danger placeholder-danger/60 focus:border-danger focus:shadow-[0_0_8px_rgba(248,113,113,0.3)] bg-danger-muted/30 text-danger"
                                                                            : mappedReq ? "border-surface-border focus:border-primary focus:shadow-[0_0_8px_var(--color-primary-glow)]"
                                                                                : "border-transparent bg-transparent text-gray-500 hover:border-surface-border"
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
                            {pastedRows.length > 50 && (
                                <p className="text-xs text-center text-gray-500 font-bold tracking-wider uppercase mt-4">
                                    Displaying first 50 rows. All {pastedRows.length} rows will be imported.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {pastedRows.length > 0 && (
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
