"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import SearchableDropdown from "./SearchableDropdown";

/* ══════════════════════════════════════════════════════════════
   COLUMN DEFINITIONS
   ══════════════════════════════════════════════════════════════ */
const CORE_CREW_COLUMNS = [
    "Name", "Rank", "Age", "Nationality",
    "IC or Passport No.", "Date Sign-on (DD/MM/YYYY)",
    "No. of working days", "Comments",
];

const CONTRACTOR_COLUMNS = [
    "Name", "Vendor", "Age", "Nationality", "IC or Passport No.",
];

const COLUMN_LABELS: Record<string, string> = {
    "Name": "Name",
    "Rank": "Rank",
    "Vendor": "Vendor",
    "Age": "Age",
    "Nationality": "Nationality",
    "IC or Passport No.": "IC / Passport No.",
    "Date Sign-on (DD/MM/YYYY)": "Sign-on Date",
    "No. of working days": "Working Days",
    "Comments": "Comments",
};

const COLUMN_WIDTHS: Record<string, string> = {
    "Name": "min-w-[200px]",
    "Rank": "min-w-[120px]",
    "Vendor": "min-w-[150px]",
    "Age": "min-w-[70px] w-[80px]",
    "Nationality": "min-w-[180px]",
    "IC or Passport No.": "min-w-[155px]",
    "Date Sign-on (DD/MM/YYYY)": "min-w-[145px]",
    "No. of working days": "min-w-[95px] w-[100px]",
    "Comments": "min-w-[200px]",
};

/* ══════════════════════════════════════════════════════════════
   NATIONALITIES
   ══════════════════════════════════════════════════════════════ */
export const NATIONALITIES = [
    "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguan",
    "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian",
    "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean",
    "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Botswanan", "Brazilian",
    "Bruneian", "Bulgarian", "Burkinese", "Burmese", "Burundian", "Cambodian",
    "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian",
    "Chilean", "Chinese", "Colombian", "Comorian", "Congolese", "Costa Rican",
    "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican",
    "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirati", "Equatorial Guinean",
    "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French",
    "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian",
    "Guatemalan", "Guinean", "Guyanese", "Haitian", "Honduran", "Hungarian",
    "Icelandic", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli",
    "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakh", "Kenyan",
    "Kiribati", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian",
    "Libyan", "Lithuanian", "Luxembourg", "Macedonian", "Malagasy", "Malawian",
    "Malaysian", "Maldivian", "Malian", "Maltese", "Marshallese", "Mauritanian",
    "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian",
    "Montenegrin", "Moroccan", "Mozambican", "Namibian", "Nauruan", "Nepalese",
    "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Norwegian",
    "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean",
    "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian",
    "Rwandan", "Saint Lucian", "Salvadorean", "Samoan", "Saudi Arabian", "Scottish",
    "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovak",
    "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean",
    "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi",
    "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai",
    "Togolese", "Tongan", "Trinidadian", "Tunisian", "Turkish", "Turkmen",
    "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Vanuatuan",
    "Venezuelan", "Vietnamese", "Welsh", "Yemeni", "Zambian", "Zimbabwean",
];

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */
interface CrewMember {
    id: string;
    [key: string]: string;
}

function createEmptyRow(columns: string[], rowNum: number): CrewMember {
    const row: CrewMember = { id: crypto.randomUUID(), "No.": String(rowNum) };
    columns.forEach((col) => { row[col] = ""; });
    return row;
}

/* ══════════════════════════════════════════════════════════════
   FUZZY ALIAS MAP — maps messy Excel headers to our columns
   ══════════════════════════════════════════════════════════════ */
const ALIAS_MAP: Record<string, string[]> = {
    "Name": [
        "name", "full name", "crew name", "mariner", "seafarer",
        "employee", "employee name", "personnel", "person", "crew",
        "first name", "worker", "staff name", "fullname", "last name",
    ],
    "Rank": [
        "rank", "position", "title", "designation", "role",
        "job title", "job", "crew rank", "post",
    ],
    "Vendor": [
        "vendor", "company", "contractor", "supplier", "firm",
        "agency", "employer", "company name", "vendor name",
    ],
    "Age": ["age", "years old", "years", "dob", "date of birth"],
    "Nationality": [
        "nationality", "country", "citizenship", "nation",
        "flag state", "national", "country of origin",
    ],
    "IC or Passport No.": [
        "ic or passport no", "ic or passport no.", "passport", "ic",
        "id no", "id no.", "identity", "document no", "document no.",
        "ic number", "ic no", "ic no.", "passport number", "passport no",
        "passport no.", "id", "id number", "identification",
        "travel document", "document number", "nric", "nric no", "nric no.",
    ],
    "Date Sign-on (DD/MM/YYYY)": [
        "date sign-on", "date sign on", "sign on", "sign-on",
        "sign on date", "sign-on date", "embarkation", "embarkation date",
        "joining date", "start date", "date joined", "date of joining",
        "onboard date", "boarding date", "signon", "signon date",
    ],
    "No. of working days": [
        "no. of working days", "no of working days", "working days",
        "days worked", "tenure", "service days", "days on board",
        "days onboard", "days", "work days", "duration",
    ],
    "Comments": [
        "comments", "remarks", "notes", "observations", "comment",
        "remark", "note", "additional info",
    ],
};

function fuzzyMatchColumn(header: string): string | null {
    const n = header.toLowerCase().trim().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ");
    if (!n) return null;
    for (const [target, aliases] of Object.entries(ALIAS_MAP)) {
        if (aliases.includes(n)) return target;
    }
    for (const [target, aliases] of Object.entries(ALIAS_MAP)) {
        for (const alias of aliases) {
            if (n.includes(alias) || alias.includes(n)) return target;
        }
    }
    return null;
}

/* ══════════════════════════════════════════════════════════════
   DATE HELPERS
   ══════════════════════════════════════════════════════════════ */
function toISODate(localDate: string) {
    if (!localDate) return "";
    const parts = localDate.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    const d = new Date(localDate);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    return "";
}

function fromISODate(iso: string) {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
}

/* ══════════════════════════════════════════════════════════════
   TSV PARSER — handles Excel's quoted cells with embedded newlines
   ══════════════════════════════════════════════════════════════ */
function parseTSV(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') { currentCell += '"'; i++; }
                else inQuotes = false;
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') { inQuotes = true; }
            else if (char === "\t") { currentRow.push(currentCell); currentCell = ""; }
            else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = "";
                if (char === "\r") i++;
            } else {
                currentCell += char;
            }
        }
    }
    currentRow.push(currentCell);
    if (currentRow.some(c => c.trim())) rows.push(currentRow);
    return rows.filter(row => row.some(cell => cell && cell.trim().length > 0));
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function CrewTable() {
    const [activeTab, setActiveTab] = useState<"crew" | "contractors">("crew");
    const [crewData, setCrewData] = useState<CrewMember[]>([]);
    const [contractorData, setContractorData] = useState<CrewMember[]>([]);
    const [toast, setToast] = useState<string | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const columns = activeTab === "crew" ? CORE_CREW_COLUMNS : CONTRACTOR_COLUMNS;
    const data = activeTab === "crew" ? crewData : contractorData;
    const setData = activeTab === "crew" ? setCrewData : setContractorData;
    const isCrew = activeTab === "crew";

    /* ——— Toast auto-dismiss ——— */
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    /* ——— Add / Remove Rows ——— */
    const addRow = useCallback(() => {
        setData((prev) => {
            const newRow: CrewMember = { id: crypto.randomUUID(), "No.": String(prev.length + 1) };
            columns.forEach((col) => {
                if (col !== "No.") newRow[col] = "";
            });
            return [...prev, newRow];
        });
        setTimeout(() => {
            const inputs = gridRef.current?.querySelectorAll<HTMLElement>(`[data-col="Name"]`);
            if (inputs?.length) inputs[inputs.length - 1].focus();
        }, 50);
    }, [columns, setData]);

    const removeRow = useCallback(
        (id: string) => {
            setData((prev) => {
                if (prev.length <= 0) return prev;
                return prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, "No.": String(i + 1) }));
            });
        }, [setData]
    );

    const updateCell = useCallback((id: string, col: string, value: string) => {
        setData(prev => prev.map(r => r.id === id ? { ...r, [col]: value } : r));
    }, [setData]);

    /* ——— Paste handler — intercepts tabular (Excel) data ——— */
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData("text/plain");
        if (!text.trim() || !text.includes("\t")) return;

        e.preventDefault();
        e.stopPropagation();

        const allRows = parseTSV(text);
        if (allRows.length === 0) return;

        // Detect and drop index columns (No., #, S/N)
        const rawHeaders = allRows[0].map(h => h.trim());
        const colsToDrop = new Set<number>();
        rawHeaders.forEach((h, idx) => {
            const lower = h.toLowerCase().replace(/[\r\n]+/g, "");
            if (lower === "no." || lower === "no" || lower === "#" || lower === "s/n") colsToDrop.add(idx);
        });
        const cleanHeaders = rawHeaders.filter((_, idx) => !colsToDrop.has(idx));

        // Try fuzzy match to detect header row
        const mapping: Record<number, string> = {};
        cleanHeaders.forEach((h, i) => {
            const match = fuzzyMatchColumn(h);
            if (match && columns.includes(match) && !Object.values(mapping).includes(match)) {
                mapping[i] = match;
            }
        });
        const hasHeaders = Object.keys(mapping).length >= 2;

        let dataRows: string[][];
        let colMap: (string | null)[];

        if (hasHeaders) {
            dataRows = allRows.slice(1).map(row => row.filter((_, idx) => !colsToDrop.has(idx)));
            colMap = cleanHeaders.map((_, i) => mapping[i] || null);
        } else {
            dataRows = allRows.map(row => {
                const cleaned = row.filter((_, idx) => !colsToDrop.has(idx));
                return cleaned;
            });
            colMap = columns.slice(0, cleanHeaders.length);
        }

        let addedCount = 0;
        setData(prev => {
            const startNum = prev.length + 1;
            const newRows: CrewMember[] = [];
            dataRows.forEach((cells, idx) => {
                const row: CrewMember = { id: crypto.randomUUID(), "No.": String(startNum + idx) };
                columns.forEach(c => { row[c] = ""; });
                colMap.forEach((mappedCol, ci) => {
                    if (mappedCol && cells[ci]?.trim()) row[mappedCol] = cells[ci].trim();
                });
                if (columns.some(c => row[c]?.trim())) newRows.push(row);
            });
            addedCount = newRows.length;
            return [...prev, ...newRows];
        });

        // Toast feedback (compute count from data rows directly)
        const count = dataRows.filter(cells => cells.some(c => c?.trim())).length;
        if (count > 0) setToast(`Pasted ${count} row${count !== 1 ? "s" : ""}`);
    }, [columns, setData]);

    /* ——— Keyboard navigation ——— */
    const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const next = gridRef.current?.querySelector<HTMLElement>(
                `[data-row="${rowIdx + 1}"][data-col-idx="${colIdx}"]`
            );
            if (next) next.focus();
            else addRow();
        }
    }, [addRow]);

    const focusNextCell = useCallback((rowIdx: number, colIdx: number) => {
        const next = gridRef.current?.querySelector<HTMLElement>(
            `[data-row="${rowIdx}"][data-col-idx="${colIdx + 1}"]`
        );
        if (next) next.focus();
    }, []);

    /* ——— Missing field tracking ——— */
    const keyFields = isCrew
        ? ["Name", "Rank", "Age", "Nationality", "IC or Passport No.", "Date Sign-on (DD/MM/YYYY)", "No. of working days"]
        : ["Name", "Vendor", "Age", "Nationality", "IC or Passport No."];

    const getMissingCount = (row: CrewMember) =>
        keyFields.filter(col => !row[col]?.trim()).length;

    const totalCount = data.length;
    const incompleteCount = data.filter(r => getMissingCount(r) > 0).length;

    /* ——— Cell renderer ——— */
    const renderCell = (row: CrewMember, col: string, rowIdx: number, colIdx: number) => {
        const val = row[col] || "";
        const isRequired = keyFields.includes(col);
        const isEmpty = isRequired && !val.trim();
        const cellBase = `w-full px-2.5 py-2 text-sm bg-transparent border border-transparent rounded-sm outline-none transition-all duration-100
            text-foreground font-(family-name:--font-jetbrains)
            hover:border-surface-border
            focus:border-primary focus:bg-surface focus:shadow-[0_0_0_2px_var(--color-primary-glow)]
            ${isEmpty ? "placeholder:text-warning/50" : "placeholder:text-gray-600"}`;
        const cellNav = {
            "data-row": rowIdx,
            "data-col-idx": colIdx,
            "data-col": col,
        };

        if (col === "Nationality") {
            return (
                <div {...cellNav}>
                    <SearchableDropdown
                        options={NATIONALITIES}
                        value={val}
                        onChange={(v) => updateCell(row.id, col, v)}
                        placeholder="Select..."
                        id={`grid-${row.id}-nat`}
                        onComplete={() => focusNextCell(rowIdx, colIdx)}
                        error={isEmpty}
                    />
                </div>
            );
        }

        if (col === "Date Sign-on (DD/MM/YYYY)") {
            return (
                <input
                    type="date"
                    value={toISODate(val)}
                    onChange={(e) => updateCell(row.id, col, fromISODate(e.target.value))}
                    onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                    className={cellBase}
                    {...cellNav}
                />
            );
        }

        if (col === "Age") {
            return (
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={val}
                    onChange={(e) => updateCell(row.id, col, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                    placeholder="—"
                    className={cellBase}
                    {...cellNav}
                />
            );
        }

        if (col === "No. of working days") {
            return (
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={val}
                    onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        if (v === "" || parseInt(v) <= 90) updateCell(row.id, col, v);
                    }}
                    onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                    placeholder="≤ 90"
                    className={cellBase}
                    {...cellNav}
                />
            );
        }

        return (
            <input
                type="text"
                value={val}
                onChange={(e) => updateCell(row.id, col, e.target.value)}
                onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                placeholder={
                    col === "Name" ? "Full name"
                        : col === "Rank" ? "e.g. Captain"
                            : col === "Vendor" ? "Company"
                                : col === "IC or Passport No." ? "ID number"
                                    : col === "Comments" ? "Notes..."
                                        : "—"
                }
                className={cellBase}
                {...cellNav}
            />
        );
    };

    /* ══════════════════════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════════════════════ */
    return (
        <div className="space-y-5">

            {/* ——— Top controls ——— */}
            <div className="flex items-center justify-between relative">
                {/* Tab toggle */}
                <div className="inline-flex rounded-lg border border-surface-border overflow-hidden relative z-10 bg-surface">
                    <button
                        type="button"
                        onClick={() => setActiveTab("crew")}
                        className={`px-5 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2
                            ${activeTab === "crew" ? "bg-primary-100 text-primary" : "bg-surface text-gray-400 hover:text-foreground hover:bg-surface-hover"}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Core Crew
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("contractors")}
                        className={`px-5 py-2.5 text-sm font-semibold transition-all duration-150 border-l border-surface-border cursor-pointer flex items-center gap-2
                            ${activeTab === "contractors" ? "bg-primary-100 text-primary" : "bg-surface text-gray-400 hover:text-foreground hover:bg-surface-hover"}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contractors
                    </button>
                </div>

                {/* View Title */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h1 className="text-[22px] font-extrabold text-foreground uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(226,232,240,0.15)]">
                        {isCrew ? "TOUR OF DUTY" : "CONTRACTORS LIST"}
                    </h1>
                </div>

                {/* Summary stats */}
                <div className="flex items-center gap-4 relative z-10">
                    {totalCount > 0 && (
                        <div className="flex items-center gap-3 text-xs">
                            <span className="font-semibold text-primary font-(family-name:--font-jetbrains)">{totalCount}</span>
                            <span className="text-gray-400">{isCrew ? "crew" : "contractors"}</span>
                            {incompleteCount > 0 && (
                                <>
                                    <span className="text-gray-600">·</span>
                                    <span className="text-warning font-bold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                        {incompleteCount} incomplete
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ——— Spreadsheet Grid ——— */}
            <div
                ref={gridRef}
                onPaste={handlePaste}
                tabIndex={-1}
                className="vdr-card overflow-hidden focus:outline-none"
            >
                <div className="overflow-x-auto
                    [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-surface-raised [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full border-collapse text-sm">
                        {/* ——— Header ——— */}
                        <thead>
                            <tr className="bg-surface-raised">
                                <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-r border-surface-border w-12 sticky left-0 bg-surface-raised z-20">
                                    #
                                </th>
                                {columns.map(col => (
                                    <th
                                        key={col}
                                        className={`px-2 py-3 text-left text-[10px] font-bold text-sky-300 uppercase tracking-widest border-b border-r border-surface-border whitespace-nowrap ${COLUMN_WIDTHS[col] || "min-w-30"}`}
                                    >
                                        {COLUMN_LABELS[col] || col}
                                    </th>
                                ))}
                                <th className="px-2 py-3 border-b border-surface-border w-10" />
                            </tr>
                        </thead>

                        {/* ——— Body ——— */}
                        <tbody>
                            {data.length === 0 ? (
                                /* Empty state */
                                <tr>
                                    <td colSpan={columns.length + 2} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <svg className="w-12 h-12 text-gray-400/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
                                            </svg>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1.5">No {isCrew ? "crew members" : "contractors"} yet</p>
                                                <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
                                                    Paste from Excel
                                                    <kbd className="px-1.5 py-0.5 rounded border border-surface-border bg-surface-raised text-[10px] font-(family-name:--font-jetbrains) text-gray-400">Ctrl+V</kbd>
                                                    or click <span className="text-primary font-bold">+ Add Row</span> below
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, rowIdx) => {
                                    const missing = getMissingCount(row);
                                    return (
                                        <tr
                                            key={row.id}
                                            className={`group border-b border-surface-border/30 transition-colors
                                                ${rowIdx % 2 === 1 ? "bg-surface-raised/20" : ""}
                                                hover:bg-surface-hover/40`}
                                            style={{ position: "relative", zIndex: data.length - rowIdx }}
                                        >
                                            {/* Row number */}
                                            <td className="px-3 py-1 text-center border-r border-surface-border/40 sticky left-0 bg-surface z-10 w-12 shrink-0">
                                                <div className="flex flex-col items-center justify-center gap-1.5 relative">
                                                    <span className="text-[11px] font-bold text-gray-500 font-[family-name:var(--font-jetbrains)]">
                                                        {row["No."]}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Data cells */}
                                            {columns.map((col, colIdx) => (
                                                <td key={col} className="px-0.5 py-0.5 border-r border-surface-border/15">
                                                    {renderCell(row, col, rowIdx, colIdx)}
                                                </td>
                                            ))}

                                            {/* Delete button */}
                                            <td className="px-1 py-0.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(row.id)}
                                                    className="p-1.5 text-transparent group-hover:text-gray-600 hover:text-danger! rounded hover:bg-danger-muted transition-all cursor-pointer"
                                                    aria-label="Delete row"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ——— Add row footer ——— */}
                <div className="flex items-center justify-between border-t border-surface-border bg-surface-raised/30 px-3 py-2">
                    <button
                        type="button"
                        onClick={addRow}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-primary hover:text-primary-hover hover:bg-primary-50 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Row
                    </button>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold select-none">
                        <kbd className="px-1.5 py-0.5 rounded border border-surface-border bg-surface-raised text-[10px] font-(family-name:--font-jetbrains)">Ctrl+V</kbd>
                        <span>Paste from Excel</span>
                    </div>
                </div>
            </div>

            {/* ——— Toast notification ——— */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 animate-fade-in">
                    <div className="flex items-center gap-2.5 px-5 py-3 bg-surface-raised border border-success/30 rounded-xl shadow-2xl shadow-black/40 text-sm font-semibold text-success">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {toast}
                    </div>
                </div>
            )}
        </div>
    );
}
