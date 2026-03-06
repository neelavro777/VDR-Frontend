# Vessel Operations & Crew Management System

A web application designed for maritime daily operations, activity logging, and crew management. This system prioritizes speed, data integrity, and a professional "Daily Operations" aesthetic.

## Key Features

### 1. Smart Import (Excel/TSV)
Avoid the headache of unpredictable file uploads. The Smart Import feature uses a **Copy/Paste workflow**:
- **Auto Mapping**: Automatically detects and maps user-pasted columns (e.g., "Full Name" → "Name")
- **Inline Validation**: A dedicated preview table highlights missing or invalid data with high-visibility red markers.
- **Contextual Editing**: Edit fields, select nationalities via searchable dropdowns, and pick dates directly within the preview before finalizing the import.

### 2. Daily Operations Activity Log
A dynamic, timeline-based logger for recording vessel movements and operational data:
- **Intelligent Duration Check**: Automatically calculates durations (e.g., `2h 30m`) between log entries.
- **Live Progress Ring**: A visual representation of the 24-hour cycle completion.
- **Operational Pills**: High-visibility indicators for DP status, Lifts, POB, and Vessel Movement Categories.
- **Step-by-Step Wizard**: A guided 4-step dialog for creating detailed log entries with precision TimePickers.

### 3. Crew & Contractors Management
Efficiently manage "Tour of Duty" and "Contractor Lists":
- **List View**: Optimized for high-density data display.
- **Dynamic Slide-over Drawer**: Edit personnel details, manage passports, or add sign-on comments without losing context.
- **Status Indicators**: Visual warnings for missing documentation or incomplete profiles.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks (`useCallback`, `useMemo`, `useRef`)
- **Icons**: SVG-based system for performance and sharpness.

## 💻 Local Setup

To run this project on your local machine, ensure you have [Node.js](https://nodejs.org/) installed (v18.x or later recommended).

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the App**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

- `/app/components`: Core UI components (ActivityLog, SmartImportModal, TimePicker, etc.)
- `/app/globals.css`: Design system tokens, Tailwind configurations, and custom animations.
- `/public`: Static assets and icons.
