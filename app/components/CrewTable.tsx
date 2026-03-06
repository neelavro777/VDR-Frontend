"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import SmartImportModal from "./SmartImportModal";
import SearchableDropdown from "./SearchableDropdown";

/* ——— Column definitions ——— */
const CORE_CREW_COLUMNS = [
    "No.", "Name", "Rank", "Age", "Nationality",
    "IC or Passport No.", "Date Sign-on (DD/MM/YYYY)",
    "No. of working days", "Comments",
];

const CONTRACTOR_COLUMNS = [
    "No.", "Name", "Vendor", "Age", "Nationality", "IC or Passport No.",
];

/* ——— Nationalities ——— */
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

/* ——— Types ——— */
interface CrewMember {
    id: string;
    [key: string]: string;
}

function createEmptyRow(columns: string[], rowNum: number): CrewMember {
    const row: CrewMember = { id: crypto.randomUUID() };
    columns.forEach((col) => {
        row[col] = col === "No." ? String(rowNum) : "";
    });
    return row;
}

/* ——— Avatar component ——— */
function Avatar({ name }: { name: string }) {
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

    return (
        <div className="w-11 h-11 rounded-full bg-primary-200 border-2 border-primary-muted flex items-center justify-center shrink-0 shadow-[0_0_12px_var(--color-primary-glow)]">
            {initials ? (
                <span className="text-sm font-bold text-primary tracking-wide">{initials}</span>
            ) : (
                <svg className="w-5 h-5 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
            )}
        </div>
    );
}

/* ——— Slide-over Drawer ——— */
function SlideOverDrawer({
    isOpen, onClose, title, columns, editingRow, onSave, isCrew,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    columns: string[];
    editingRow: CrewMember | null;
    onSave: (row: CrewMember) => void;
    isCrew: boolean;
}) {
    const [formData, setFormData] = useState<CrewMember>(() => ({ id: "", "No.": "" }));
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && editingRow) {
            setFormData({ ...editingRow });
        } else if (isOpen) {
            const newRow: CrewMember = { id: crypto.randomUUID(), "No.": "" };
            columns.forEach((col) => { if (col !== "No.") newRow[col] = ""; });
            setFormData(newRow);
        }
    }, [isOpen, editingRow, columns]);

    // Auto-resize textarea fallback
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [formData["Comments"]]);

    const updateField = (col: string, value: string) => {
        setFormData((prev) => ({ ...prev, [col]: value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    // Convert DD/MM/YYYY to YYYY-MM-DD for date input
    const toISODate = (ddmmyyyy: string) => {
        if (!ddmmyyyy) return "";
        const parts = ddmmyyyy.split("/");
        if (parts.length !== 3) return ddmmyyyy;
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    // Convert YYYY-MM-DD to DD/MM/YYYY for storage
    const fromISODate = (iso: string) => {
        if (!iso) return "";
        const parts = iso.split("-");
        if (parts.length !== 3) return iso;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    if (!isOpen) return null;

    const editableColumns = columns.filter((c) => c !== "No.");

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in"
                onClick={onClose}
            />
            {/* Drawer */}
            <div className="absolute top-0 right-0 h-full w-full max-w-md bg-surface border-l border-surface-border shadow-2xl shadow-black/50 animate-slide-in-right flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border">
                    <h2 className="text-lg font-bold text-foreground">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-foreground hover:bg-surface-hover rounded-lg transition-all cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {editableColumns.map((col) => {
                        const labelText = col === "Date Sign-on (DD/MM/YYYY)" ? "Sign-on Date"
                            : col === "No. of working days" ? "Working Days"
                                : col === "IC or Passport No." ? "IC / Passport No."
                                    : col;

                        return (
                            <div key={col}>
                                <label className="block text-xs font-bold text-sky-300 uppercase tracking-widest mb-2">
                                    {labelText}
                                </label>

                                {col === "Nationality" ? (
                                    <SearchableDropdown
                                        options={NATIONALITIES}
                                        value={formData[col] || ""}
                                        onChange={(v) => updateField(col, v)}
                                        placeholder="Type to search nationality..."
                                        id={`drawer-${col}`}
                                    />
                                ) : col === "Date Sign-on (DD/MM/YYYY)" ? (
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={toISODate(formData[col] || "")}
                                            onChange={(e) => updateField(col, fromISODate(e.target.value))}
                                            className="vdr-input font-[family-name:var(--font-jetbrains)]"
                                        />
                                    </div>
                                ) : col === "Age" ? (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={3}
                                        value={formData[col] || ""}
                                        onChange={(e) => updateField(col, e.target.value.replace(/\D/g, ""))}
                                        placeholder="e.g. 34"
                                        className="vdr-input font-[family-name:var(--font-jetbrains)] w-24"
                                    />
                                ) : col === "No. of working days" ? (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={2}
                                        value={formData[col] || ""}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, "");
                                            if (v === "" || parseInt(v) <= 90) updateField(col, v);
                                        }}
                                        placeholder="≤ 90"
                                        className="vdr-input font-[family-name:var(--font-jetbrains)] w-24"
                                    />
                                ) : col === "Comments" ? (
                                    <textarea
                                        ref={textareaRef}
                                        value={formData[col] || ""}
                                        onChange={(e) => updateField(col, e.target.value)}
                                        placeholder="Additional notes..."
                                        className="vdr-input auto-expand"
                                        rows={2}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={formData[col] || ""}
                                        onChange={(e) => updateField(col, e.target.value)}
                                        placeholder={
                                            col === "Name" ? "Full name"
                                                : col === "Rank" ? "e.g. Captain"
                                                    : col === "Vendor" ? "Company name"
                                                        : col === "IC or Passport No." ? "ID number"
                                                            : "—"
                                        }
                                        className="vdr-input"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-surface-border bg-surface-raised/50 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-semibold text-gray-400 border border-surface-border rounded-lg hover:bg-surface-hover transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!formData["Name"]?.trim()}
                        className="flex-1 py-2.5 text-sm font-bold text-gray-50 bg-primary rounded-lg hover:bg-primary-hover transition-all hover:shadow-[0_0_16px_var(--color-primary-glow)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {editingRow ? "Update" : "Add"} {isCrew ? "Crew Member" : "Contractor"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ——— Main Component ——— */
export default function CrewTable() {
    const [activeTab, setActiveTab] = useState<"crew" | "contractors">("crew");
    const [crewData, setCrewData] = useState<CrewMember[]>([]);
    const [contractorData, setContractorData] = useState<CrewMember[]>([]);
    const [importOpen, setImportOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<CrewMember | null>(null);

    const columns = activeTab === "crew" ? CORE_CREW_COLUMNS : CONTRACTOR_COLUMNS;
    const data = activeTab === "crew" ? crewData : contractorData;
    const setData = activeTab === "crew" ? setCrewData : setContractorData;
    const isCrew = activeTab === "crew";

    const removeRow = useCallback(
        (id: string) => {
            setData((prev) => {
                if (prev.length <= 0) return prev;
                return prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, "No.": String(i + 1) }));
            });
        }, [setData]
    );

    const handleSave = useCallback(
        (row: CrewMember) => {
            setData((prev) => {
                const existingIdx = prev.findIndex((r) => r.id === row.id);
                if (existingIdx >= 0) {
                    // Update existing
                    return prev.map((r) => r.id === row.id ? { ...row } : r);
                } else {
                    // Add new
                    const newRow = { ...row, "No.": String(prev.length + 1) };
                    return [...prev, newRow];
                }
            });
        }, [setData]
    );

    const handleImport = useCallback(
        (imported: Record<string, string>[]) => {
            setData((prev) => {
                const startNum = prev.length + 1;
                const newRows: CrewMember[] = imported.map((item, idx) => {
                    const row: CrewMember = { id: crypto.randomUUID() };
                    columns.forEach((col) => {
                        row[col] = col === "No." ? String(startNum + idx) : (item[col] || "");
                    });
                    return row;
                });
                return [...prev, ...newRows];
            });
        }, [setData, columns]
    );

    const openAdd = () => {
        setEditingRow(null);
        setDrawerOpen(true);
    };

    const openEdit = (row: CrewMember) => {
        setEditingRow(row);
        setDrawerOpen(true);
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        return dateStr; // Already in DD/MM/YYYY
    };

    // Required fields for missing-field highlighting (skip No., Comments)
    const keyFields = isCrew
        ? ["Name", "Rank", "Age", "Nationality", "IC or Passport No.", "Date Sign-on (DD/MM/YYYY)", "No. of working days"]
        : ["Name", "Vendor", "Age", "Nationality", "IC or Passport No."];

    const getMissingCount = (row: CrewMember) =>
        keyFields.filter((col) => !row[col]?.trim()).length;

    return (
        <div className="space-y-5">
            {/* Top controls */}
            <div className="flex items-center justify-between relative">
                {/* Sub-tabs */}
                <div className="inline-flex rounded-lg border border-surface-border overflow-hidden relative z-10 bg-surface">
                    <button
                        type="button"
                        onClick={() => setActiveTab("crew")}
                        className={`px-5 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2
              ${activeTab === "crew"
                                ? "bg-primary-100 text-primary"
                                : "bg-surface text-gray-400 hover:text-foreground hover:bg-surface-hover"
                            }`}
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
              ${activeTab === "contractors"
                                ? "bg-primary-100 text-primary"
                                : "bg-surface text-gray-400 hover:text-foreground hover:bg-surface-hover"
                            }`}
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

                {/* Action buttons */}
                <div className="flex items-center gap-3 relative z-10">
                    <button
                        type="button"
                        onClick={() => setImportOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-50 bg-primary hover:bg-primary-hover rounded-lg transition-all duration-200 hover:shadow-[0_0_16px_var(--color-primary-glow)] cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Smart Import
                    </button>
                </div>
            </div>

            {/* Summary bar */}
            <div className="vdr-card flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">{isCrew ? "Crew Members" : "Contractors"}</span>
                    <span className="font-semibold text-primary font-[family-name:var(--font-jetbrains)]">{data.length}</span>
                </div>
                <button
                    type="button"
                    onClick={openAdd}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-primary text-primary hover:bg-primary-50 hover:shadow-[0_0_16px_var(--color-primary-glow)] rounded-lg transition-all duration-200 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add {isCrew ? "Crew Member" : "Contractor"}
                </button>
            </div>

            {/* Rich List */}
            <div className="space-y-2">
                {data.length === 0 && (
                    <div className="vdr-card flex flex-col items-center justify-center py-16 text-center">
                        <svg className="w-12 h-12 text-gray-400/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-gray-400 text-sm mb-1">No {isCrew ? "crew members" : "contractors"} added yet</p>
                        <p className="text-gray-500 text-xs">Click &quot;Add {isCrew ? "Crew Member" : "Contractor"}&quot; or use Smart Import</p>
                    </div>
                )}

                {data.map((row) => {
                    const missing = getMissingCount(row);
                    return (
                        <div
                            key={row.id}
                            onClick={() => openEdit(row)}
                            className={`vdr-card group px-5 py-4 flex items-center gap-5 hover:bg-surface-hover/50 transition-all duration-200 cursor-pointer
                            ${missing > 0 ? "border-warning/40 hover:border-warning/60" : "hover:border-primary-muted"}`}
                        >
                            {/* Block 1: Profile */}
                            <div className="flex items-center gap-4 w-[220px] shrink-0">
                                <Avatar name={row["Name"] || ""} />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {row["Name"] || <span className="text-gray-500 italic font-normal">Unnamed</span>}
                                        </p>
                                        {missing > 0 && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning bg-warning-muted rounded shrink-0">
                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                </svg>
                                                {missing}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5 font-[family-name:var(--font-jetbrains)]">
                                        {row["Age"] ? `Age: ${row["Age"]}` : "Age: —"}
                                    </p>
                                </div>
                            </div>

                            {/* Block 2: Role Badge */}
                            <div className="w-[160px] shrink-0">
                                {(row["Rank"] || row["Vendor"]) ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary-100 border border-primary-muted rounded-full">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                        </svg>
                                        {row["Rank"] || row["Vendor"]}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-500 italic">No role</span>
                                )}
                            </div>

                            {/* Block 3: Documentation */}
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                <div className="w-[110px] shrink-0">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Nationality</p>
                                    <p className="text-sm text-foreground truncate font-[family-name:var(--font-jetbrains)]">
                                        {row["Nationality"] || <span className="text-gray-500">—</span>}
                                    </p>
                                </div>
                                <div className="w-[120px] shrink-0">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">IC / Passport</p>
                                    <p className="text-sm text-foreground truncate font-[family-name:var(--font-jetbrains)]">
                                        {row["IC or Passport No."] || <span className="text-gray-500">—</span>}
                                    </p>
                                </div>

                                {/* Core Crew extra fields */}
                                {isCrew && (
                                    <>
                                        <div className="w-[80px] shrink-0">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Sign-on</p>
                                            <p className="text-sm text-foreground truncate font-[family-name:var(--font-jetbrains)]">
                                                {formatDate(row["Date Sign-on (DD/MM/YYYY)"]) || <span className="text-gray-500">—</span>}
                                            </p>
                                        </div>
                                        <div className="w-[60px] shrink-0">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Days</p>
                                            <p className="text-sm text-foreground truncate font-[family-name:var(--font-jetbrains)]">
                                                {row["No. of working days"] || <span className="text-gray-500">—</span>}
                                            </p>
                                        </div>
                                        <div
                                            className="min-w-0 flex-1 group/comment cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                                        >
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5 transition-colors group-hover/comment:text-primary">
                                                Comments
                                            </p>
                                            {row["Comments"] ? (
                                                <p className="text-sm text-gray-400 truncate italic group-hover/comment:text-gray-300 transition-colors">
                                                    {row["Comments"]}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-500/50 truncate italic border border-dashed border-gray-600/30 rounded px-2 py-0.5 w-fit group-hover/comment:border-primary/50 group-hover/comment:text-primary/70 transition-colors">
                                                    + Add comment here
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Row number + Delete */}
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-raised text-[10px] font-bold text-gray-500 font-[family-name:var(--font-jetbrains)]">
                                    {row["No."]}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                                    className="p-1.5 text-gray-400 hover:text-danger rounded-md hover:bg-danger-muted transition-all duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                                    aria-label="Remove entry"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Slide-over Drawer */}
            <SlideOverDrawer
                isOpen={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditingRow(null); }}
                title={editingRow
                    ? `Edit ${isCrew ? "Crew Member" : "Contractor"}`
                    : `Add ${isCrew ? "Crew Member" : "Contractor"}`}
                columns={columns}
                editingRow={editingRow}
                onSave={handleSave}
                isCrew={isCrew}
            />

            {/* Smart Import Modal */}
            <SmartImportModal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                requiredColumns={columns.filter((c) => c !== "No.")}
                onImport={handleImport}
            />
        </div>
    );
}
