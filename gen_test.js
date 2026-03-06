const XLSX = require("xlsx");
const path = require("path");

// Test 1: Fuzzy headers + missing columns + garbage rows + 2 sheets
const wb1 = XLSX.utils.book_new();
const d1 = [
    { "Full Name": "Ahmad Bin Hassan", "Position": "Captain", "Nationality": "Malaysian", "Passport": "A11223344", "Age": 45 },
    { "Full Name": "Rajesh Kumar", "Position": "Chief Engineer", "Nationality": "Indian", "Passport": "B55667788", "Age": 38 },
    { "Full Name": "Li Wei", "Position": "2nd Officer", "Nationality": "Chinese", "Passport": "C99001122", "Age": 29 },
    { "Full Name": "James O'Brien", "Position": "", "Nationality": "Irish", "Passport": "", "Age": 52 },
    { "Full Name": "Tanaka Yuki", "Position": "AB Seaman", "Nationality": "", "Passport": "E33445566", "Age": "" },
    { "Full Name": "", "Position": "", "Nationality": "", "Passport": "", "Age": "" },
];
XLSX.utils.book_append_sheet(wb1, XLSX.utils.json_to_sheet(d1), "Crew List");
XLSX.utils.book_append_sheet(wb1, XLSX.utils.aoa_to_sheet([["Instructions"], ["Fill crew data"]]), "Instructions");

const out1 = path.join("C:", "Users", "user", "Desktop", "test_crew_fuzzy.xlsx");
XLSX.writeFile(wb1, out1);

// Test 2: Date columns + different header names
const wb2 = XLSX.utils.book_new();
const d2 = [
    ["Crew Name", "Rank", "Age", "Country", "IC Number", "Sign On Date", "Working Days"],
    ["Maria Santos", "Bosun", 33, "Filipino", "PH1234567", new Date(2024, 0, 15), 45],
    ["Ole Andersen", "Master", 50, "Norwegian", "NO9876543", new Date(2024, 2, 1), 30],
    ["Chen Ming", "Cook", 28, "Chinese", "CN5551234", new Date(2024, 5, 10), 60],
];
XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet(d2, { cellDates: true }), "Personnel");

const out2 = path.join("C:", "Users", "user", "Desktop", "test_crew_dates.xlsx");
XLSX.writeFile(wb2, out2);

console.log("Done: test files on Desktop");
