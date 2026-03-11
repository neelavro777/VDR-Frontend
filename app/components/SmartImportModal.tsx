"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import SearchableDropdown from "./SearchableDropdown";
import { NATIONALITIES } from "./CrewTable";

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
    // gridData maps directly to requiredColumns indices
    const [gridData, setGridData] = useState<string[][]>([]);
    const dropzoneRef = useRef<HTMLDivElement>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setGridData([]);
            setTimeout(() => {
                dropzoneRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    /* ——— Paste Handling ——— */
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData("text/plain");

        if (!text.trim()) {
            setGridData([]);
            return;
        }

        const parsedRows = parseTSV(text);
        if (parsedRows.length === 0) return;

        // Auto-detect if first row is headers (by checking if 'no', 'name', etc are present)
        let startIndex = 0;
        const firstRowString = parsedRows[0].join(" ").toLowerCase();
        if (firstRowString.includes("name") || firstRowString.includes("nationality") || firstRowString.includes("rank")) {
            // First row looks like headers, skip it so we don't import headers as data
            startIndex = 1;
        }

        const dataRows = parsedRows.slice(startIndex).map(row => {
            // Force the row to have the same length as requiredColumns
            const normalizedRow = new Array(requiredColumns.length).fill("");
            for (let i = 0; i < Math.min(row.length, requiredColumns.length); i++) {
                normalizedRow[i] = row[i]?.trim() || "";
            }
            return normalizedRow;
        });

        setGridData(dataRows);
        e.preventDefault();
    }, [requiredColumns]);

    /* ——— Template Download ——— */
    const downloadTemplate = useCallback(() => {
        const headers = requiredColumns.join("\t");
        const blob = new Blob([headers], { type: "text/tsv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Import_Template.tsv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [requiredColumns]);

    /* ——— Grid Editing ——— */
    const updateCell = useCallback((rowIdx: number, colIdx: number, value: string) => {
        setGridData(prev => prev.map((row, i) =>
            i === rowIdx ? row.map((cell, j) => j === colIdx ? value : cell) : row
        ));
    }, []);

    const removeRow = useCallback((rowIdx: number) => {
        setGridData(prev => prev.filter((_, i) => i !== rowIdx));
    }, []);

    /* ——— Import Action ——— */
    const handleImport = useCallback(() => {
        const mappedData = gridData.map(rowCells => {
            const rowObj: Record<string, string> = {};
            requiredColumns.forEach((c, idx) => {
                rowObj[c] = rowCells[idx] || "";
            });
            return rowObj;
        }).filter(row => Object.values(row).some(val => val.trim().length > 0));

        onImport(mappedData);
        onClose();
    }, [gridData, requiredColumns, onImport, onClose]);

    if (!isOpen) return null;

    // Validation
    const requiredColIndices = requiredColumns
        .map((col, idx) => col !== "Comments" ? idx : -1)
        .filter(idx => idx !== -1);

    let totalMissing = 0;
    gridData.forEach(row => {
        requiredColIndices.forEach(idx => {
            if (!row[idx]?.trim()) totalMissing++;
        });
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md animate-backdrop-in" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-[95vw] h-[90vh] bg-[#0b1221] rounded-xl shadow-2xl border border-surface-border overflow-hidden flex flex-col mx-4 animate-fade-in shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-[#0f172a] shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-3 font-[family-name:var(--font-jetbrains)] tracking-wide">
                                <span className="bg-primary/20 p-1.5 rounded-md text-primary ring-1 ring-primary/30">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </span>
                                SMART GRID
                            </h2>
                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
                                Direct Excel Copy-Paste Environment
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 rounded bg-primary/10 hover:bg-primary/20 hover:border-primary/60 transition-colors cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Get Template
                        </button>
                        <button
                            type="button" onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-all duration-150 cursor-pointer"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto bg-[#040812]">
                    {gridData.length === 0 ? (
                        /* ─── The Input Area ─── */
                        <div className="flex flex-col items-center justify-center p-8 h-full min-h-[500px]">
                            <div
                                tabIndex={0}
                                ref={dropzoneRef}
                                onPaste={handlePaste}
                                className="w-full max-w-4xl h-96 flex flex-col items-center justify-center border border-surface-border rounded-xl bg-[#0f172a] cursor-text
                                    transition-all duration-300 group shadow-inner relative overflow-hidden focus:outline-none focus:border-primary/50"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-focus:opacity-100 transition-opacity pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent scale-x-0 group-focus:scale-x-100 transition-transform duration-500" />

                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-[#1e293b] group-focus:bg-primary/20 group-focus:ring-2 ring-primary/50 transition-all duration-300 group-focus:scale-110 group-focus:shadow-[0_0_30px_var(--color-primary-glow)]">
                                    <svg className="w-10 h-10 text-gray-400 group-focus:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-3xl font-extrabold text-white mb-3 tracking-widest font-[family-name:var(--font-jetbrains)] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                                    PASTE EXCEL DATA
                                </p>
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded bg-black/40 border border-surface-border/50 text-sm font-[family-name:var(--font-jetbrains)] text-gray-300 shadow-inner">
                                    <span className="font-bold text-white">Ctrl</span> <span className="text-primary font-bold">+</span> <span className="font-bold text-white">V</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-6 max-w-sm text-center font-medium leading-relaxed">
                                    Ensure your columns strictly match the system's template format.
                                    We've removed the mapping step for maximum speed.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* ─── Strict Grid ─── */
                        <div className="h-full flex flex-col">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-6 py-2 bg-[#0f172a] border-b border-surface-border shrink-0">
                                <div className="flex items-center gap-4 text-xs font-[family-name:var(--font-jetbrains)]">
                                    <span className="text-primary font-bold tracking-wider">{gridData.length} ROWS READY</span>
                                    {totalMissing > 0 && (
                                        <span className="text-danger font-bold flex items-center gap-1.5 bg-danger/10 px-2 py-0.5 rounded border border-danger/20 tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                                            {totalMissing} MISSING FIELDS
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setGridData([])}
                                    className="text-[10px] text-gray-400 hover:text-white uppercase tracking-widest font-bold transition-colors border border-surface-border px-3 py-1.5 rounded hover:bg-[#1e293b] cursor-pointer"
                                >
                                    Clear Grid
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto bg-[#040812] relative
                                [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-3 
                                [&::-webkit-scrollbar-track]:bg-[#0f172a] 
                                [&::-webkit-scrollbar-thumb]:bg-[#334155] [&::-webkit-scrollbar-thumb]:hover:bg-primary [&::-webkit-scrollbar-corner]:bg-transparent">
                                <table className="w-full text-sm border-collapse table-fixed min-w-max">
                                    <thead className="sticky top-0 z-20">
                                        <tr>
                                            <th className="w-12 bg-[#0b1221] border-b border-r border-[#1e293b] shadow-sm"></th>
                                            {requiredColumns.map((col, idx) => {
                                                const isRequired = col !== "Comments";
                                                let w = "w-40";
                                                if (col === "Name" || col === "Comments") w = "w-64";
                                                if (col === "Nationality") w = "w-48";
                                                if (col === "Age" || col === "No. of working days") w = "w-32";

                                                return (
                                                    <th key={idx} className={`${w} px-4 py-2 text-left bg-[#0b1221] border-b border-r border-[#1e293b] font-[family-name:var(--font-jetbrains)] shadow-sm`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                                                {col === "Date Sign-on (DD/MM/YYYY)" ? "Sign-on Date" : col}
                                                            </span>
                                                            {isRequired && <span className="text-danger opacity-80 text-lg leading-none">*</span>}
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1e293b] font-[family-name:var(--font-jetbrains)] text-[13px] bg-[#0f172a]/20">
                                        {gridData.map((row, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-[#1e293b]/50 transition-colors group">
                                                {/* Delete Row Button */}
                                                <td className="w-12 text-center border-r border-[#1e293b] bg-[#0b1221] group-hover:bg-[#0f172a] transition-colors relative z-10">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow(rowIdx)}
                                                        className="text-gray-500 hover:text-danger w-full h-full p-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                        title="Remove Row"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-600 font-bold group-hover:opacity-0 transition-opacity pointer-events-none">
                                                        {rowIdx + 1}
                                                    </span>
                                                </td>

                                                {requiredColumns.map((col, colIdx) => {
                                                    const val = row[colIdx] || "";
                                                    const isRequired = col !== "Comments";
                                                    const isMissing = isRequired && !val.trim();

                                                    const cellClass = `w-full h-full min-h-[44px] px-4 py-2.5 bg-transparent outline-none transition-all cursor-text text-[13px] leading-tight
                                                        ${isMissing ? "bg-danger/10 text-danger placeholder-danger/40 focus:shadow-[inset_0_0_0_2px_rgba(248,113,113,1)]"
                                                            : "text-white placeholder-[#334155] focus:bg-primary/5 focus:shadow-[inset_0_0_0_2px_var(--color-primary)]"}
                                                    `;

                                                    return (
                                                        <td key={colIdx} className="p-0 border-r border-[#1e293b] relative group/cell align-top">
                                                            {col === "Date Sign-on (DD/MM/YYYY)" ? (
                                                                <input
                                                                    type="date"
                                                                    value={toISODate(val)}
                                                                    onChange={(e) => updateCell(rowIdx, colIdx, fromISODate(e.target.value))}
                                                                    className={`${cellClass} color-scheme-dark`}
                                                                />
                                                            ) : col === "Nationality" ? (
                                                                <div className={`h-full ${isMissing ? "bg-danger/10 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.5)]" : ""}`}>
                                                                    <select
                                                                        value={val}
                                                                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                                                                        className={cellClass + " appearance-none cursor-pointer"}
                                                                    >
                                                                        <option value="" disabled className="text-gray-500">Select...</option>
                                                                        {NATIONALITIES.map(n => (
                                                                            <option key={n} value={n} className="bg-[#0f172a] text-white">{n}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : col === "Name" || col === "Comments" ? (
                                                                <textarea
                                                                    value={val}
                                                                    onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                                                                    placeholder={isMissing ? "MISSING" : "—"}
                                                                    rows={1}
                                                                    onInput={(e) => {
                                                                        const target = e.target as HTMLTextAreaElement;
                                                                        target.style.height = 'auto';
                                                                        if (target.scrollHeight > 44) {
                                                                            target.style.height = `${target.scrollHeight}px`;
                                                                        }
                                                                    }}
                                                                    className={`${cellClass} resize-none overflow-hidden block ${isMissing ? 'shadow-[inset_0_0_0_1px_rgba(248,113,113,0.5)]' : ''}`}
                                                                />
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={val}
                                                                    onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                                                                    placeholder={isMissing ? "MISSING" : "—"}
                                                                    className={`${cellClass} ${isMissing ? 'shadow-[inset_0_0_0_1px_rgba(248,113,113,0.5)]' : ''}`}
                                                                />
                                                            )}
                                                            {/* Subtle edit indicator on hover */}
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover/cell:opacity-100 pointer-events-none text-[#334155]">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {gridData.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border bg-[#0f172a] shrink-0">
                        <div className="text-xs">
                            {totalMissing > 0 ? (
                                <span className="text-warning font-bold uppercase tracking-wider text-[10px] bg-warning-muted/20 px-3 py-2 rounded-lg border border-warning/20 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Resolve {totalMissing} missing fields before importing
                                </span>
                            ) : (
                                <span className="text-primary font-bold uppercase tracking-wider text-[10px] bg-primary/10 px-3 py-2 rounded-lg border border-primary/20 flex items-center gap-2 shadow-[0_0_10px_var(--color-primary-glow)]">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Grid validated. Ready for import.
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                type="button" onClick={onClose}
                                className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-lg transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={totalMissing > 0}
                                className="px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-black bg-primary hover:bg-primary-hover rounded-lg transition-all shadow-[0_0_20px_var(--color-primary-glow)] hover:shadow-[0_0_30px_var(--color-primary-glow)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-primary"
                            >
                                Execute Import
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
