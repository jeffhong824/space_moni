# SpaceMoni — Orbital Bio-Telemetry & Space Station Operations Console

**SpaceMoni** is an orbital bio-telemetry and space station operations monitoring console designed for astronaut crews, orbital commanders, and ground-based NASA flight surgeons. It combines continuous physiological tracking, multi-system hardware telemetry pipelines, daily experiment schedules, and mission task management with an integrated **AURA AI Flight Surgeon** powered by Google Gemini.

---

## 🛰️ Key Features

### 1. Role-Based Authentication & Access Control
- **Roles Supported**:
  - **Astronaut**: Focused personal health telemetry, daily conditioning averages, 24-hour vital waveforms, activity schedules, and AI voice consultations.
  - **Commander**: Station crew roster management, multi-astronaut conditioning summaries, and orbital operations oversight. *Note: 24-hour raw physiological telemetry is restricted to protect astronaut medical privacy.*
  - **NASA Flight Surgeon**: Complete unrestricted clinical access to all crew members, 24-hour raw telemetry waveforms, abnormal tachycardia spike analysis, and medical intervention protocols.
- **Demo Accounts**:
  - **Astronauts**: `alice_smith`, `marcus_vance`, `elena_rostova`, `sarah_connor`, `chen_wei`
  - **Commander**: `commander_shepard`
  - **NASA**: `flight_surgeon_houston`
  - **Default Password**: `12345`

### 2. 24-Hour Continuous Biometric Diagrams & Tachycardia Highlights
- **Continuous 24h Sensor Stream**: Displays hourly vitals (Resting Heart Rate, HRV, SpO2, VO2 Max) from 00:00 to 23:59 UTC.
- **Red-Highlighted Abnormalities**: Automatically highlights abnormal tachycardic episodes (>100 bpm) and severe autonomic suppression (HRV <20 ms) in red on diagrams and tables.
- **One-Click Diagnostic Shortcut**: Allows crew or flight surgeons to directly ask AURA AI for root-cause analysis and operational countermeasures.

### 3. Mission Activities & Experiment Checklist
- **Positioned for Rapid Workflow**: Located directly following the 24-hour vital diagrams.
- **Task Tracking**: Includes scheduled experiment time slots, task completion toggles, and an in-app "Add Activity" dialog.

### 4. Daily Conditioning & Connected Station Hardware Telemetry
Clicking any conditioning metric reveals the operational pipeline and past 5-day historical telemetry:
- **Sleep Duration**: Monitored via the crew member's **Hibernation Pod (#04 Telemetry Array)** with acoustic baffling and polysomnography sleep harness.
- **Exercise Countermeasures**: Read from station exercise avionics, including the **T2 Colbert Treadmill** and **Advanced Resistive Exercise Device (ARED)**.
- **Musculoskeletal Resilience**: Monitored through **ARED strain transducers** and microgravity bio-impedance segmental mesh.
- **Cognitive & Mental State**: Evaluated through regular verbal check-ins and linguistic sentiment analysis via the **AURA Station AI**.
- **Nutritional & Caloric Intake**: Determined from the **Galley Daily Meal Barcode Log** and water dispenser flowmeters.
- **Hardware Telemetry Breakdown**: Sensor status indicators, sub-metric parameters, and direct AI advisory consultation buttons for each system.

### 5. AURA AI Flight Surgeon ("Call with AI")
- **Voice-to-Text Conversational Transcript**: Simulates a secure orbital voice comm session with the station's AI medical officer.
- **Gemini-Powered Intelligence**: Uses `@google/genai` to analyze mission logs, suggest countermeasure adaptations, and answer operational health queries.
- **Interactive Action Tools**: AI responses can recommend schedule changes, prescribe electrolyte supplements, or log maintenance items directly.

### 6. Filterable Station Objectives Panel
- **Collapsible Layout**: Can be hidden or maximized using the panel toggle to allow an expansive view of health and activity diagrams.
- **Operations Oversight**: Filter tasks by status (All, Critical, Active, Completed), assign crew members, view module locations, and track progress percentages.

### 7. Orbital Clock & Mission Duration
- Live UTC clock synchronized with station time.
- Automated Mission Elapsed Time (MET) calculation since mission launch (Expedition 72).

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Motion
- **Backend / Server**: Node.js, Express, TSX, Vite middlewares
- **AI Integration**: Google Gemini API (`@google/genai`) via server-side `/api/ai-chat` proxy
- **Layout / UX**: Clean clinical space-lab light aesthetic, responsive grid and collapsible sidebars

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- (Optional) `GEMINI_API_KEY` in environment variables for live Gemini AI generation (an intelligent offline flight-surgeon fallback is included).

### Installation

```bash
# Clone the repository and navigate into the project directory
npm install
```

### Development Mode

```bash
# Starts Express dev server on port 3000 with Vite middleware
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the Vite frontend application
npm run build

# Start the Node.js production server
npm run start
```

### Type Checking & Linting

```bash
# Run TypeScript compilation check
npm run lint
```

---

## 🔒 Security & Privacy Notice
SpaceMoni adheres to NASA flight medical guidelines: raw 24-hour physiological telemetry waveforms and clinical diagnostics are restricted to NASA Flight Surgeons and the individual astronaut, while station commanders receive high-level mission readiness and duty status summaries.
