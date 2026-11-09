# SpaceMoni — 軌道生物遙測與太空站作業控制台

**SpaceMoni (coco-demo)** is an orbital bio-telemetry and space station operations monitoring console designed for astronaut crews, orbital commanders, and ground-based NASA flight surgeons. It combines continuous physiological tracking, multi-system hardware telemetry pipelines, daily experiment schedules, and mission task management with an integrated **AURA AI Flight Surgeon** powered by Google Gemini.

**2026 NASA Space Apps Challenge - Taipei Local Event**  
**Team: OGTech AI**  
**Challenge: "Create Health Monitoring Software for Astronauts on Space Missions"**

This is a working MVP demonstrating:
- Real NASA space environment data integration (DONKI Space Weather API)
- Two-level AI health analysis (overall + per-metric/system)
- Traditional Chinese (zh-Hant-TW) user interface
- Clean architectural separation (API/data, domain, UI layers)

---

## 🛰️ Key Features (新增功能標記 ⭐)

### 1. ⭐ NASA 太空環境即時監測 (NEW)
- **Real NASA DONKI Space Weather Data**: Displays live solar flares, geomagnetic storms, and coronal mass ejections from NASA's public Space Weather Database of Notifications, Knowledge, Information (DONKI)
- **Radiation Risk Assessment**: Automatically calculates crew radiation risk levels (Low/Moderate/High/Severe) based on solar activity and geomagnetic indices
- **7-Day Event Window**: Tracks recent space weather events to correlate with crew health telemetry
- **Auto-Refresh**: Updates every 30 minutes; manual refresh available
- **Fallback Mode**: Gracefully degrades with clear error messages if NASA API is unavailable

**Data Source**: 
- API: `https://api.nasa.gov/DONKI` (FLR, GST, CME endpoints)
- Free public access with DEMO_KEY (no registration required)
- Rate limit: ~1000 requests/hour

### 2. ⭐ 雙層級 AI 健康分析 (NEW)
The AURA AI Flight Surgeon now provides comprehensive two-level health analysis:

**Overall Assessment**:
- Summary health status (Nominal / Attention Required / Critical)
- Holistic evaluation of astronaut's readiness for mission tasks

**Detailed Per-Metric Analysis**:
- Resting Heart Rate (靜息心率)
- Heart Rate Variability / HRV (心率變異性)
- Blood Oxygen Saturation / SpO2 (血氧飽和度)
- Sleep Duration (睡眠時間)
- Each metric includes: current value, status, detailed analysis, and specific recommendations

**Detailed Per-System Analysis**:
- Cardiovascular System (心血管系統)
- Respiratory System (呼吸系統)
- Sleep Quality (睡眠品質)
- Exercise Performance (運動表現)
- Mental State (心理狀態)
- Musculoskeletal (肌肉骨骼)
- Nutrition (營養攝取)
- Each system includes: status, summary, specific concerns, and medical recommendations

**Traditional Chinese (zh-Hant-TW)**: All user-facing text and AI responses are now in Traditional Chinese for the Taipei local event.

**Offline Fallback**: When GEMINI_API_KEY is not set or API calls fail, an intelligent offline AURA mode provides the same two-level analysis structure with pre-computed medical logic.

### 3. Role-Based Authentication & Access Control
- **Roles Supported**:
  - **Astronaut**: Focused personal health telemetry, daily conditioning averages, 24-hour vital waveforms, activity schedules, and AI voice consultations.
  - **Commander**: Station crew roster management, multi-astronaut conditioning summaries, and orbital operations oversight. *Note: 24-hour raw physiological telemetry is restricted to protect astronaut medical privacy.*
  - **NASA Flight Surgeon**: Complete unrestricted clinical access to all crew members, 24-hour raw telemetry waveforms, abnormal tachycardia spike analysis, and medical intervention protocols.
- **Demo Accounts**:
  - **Astronauts**: `alice_smith`, `marcus_vance`, `elena_rostova`, `sarah_connor`, `chen_wei`
  - **Commander**: `commander_shepard`
  - **NASA**: `flight_surgeon_houston`
  - **Default Password**: `12345`

### 4. 24-Hour Continuous Biometric Diagrams & Tachycardia Highlights
- **Continuous 24h Sensor Stream**: Displays hourly vitals (Resting Heart Rate, HRV, SpO2, VO2 Max) from 00:00 to 23:59 UTC.
- **Red-Highlighted Abnormalities**: Automatically highlights abnormal tachycardic episodes (>100 bpm) and severe autonomic suppression (HRV <20 ms) in red on diagrams and tables.
- **One-Click Diagnostic Shortcut**: Allows crew or flight surgeons to directly ask AURA AI for root-cause analysis and operational countermeasures.

### 5. Mission Activities & Experiment Checklist
- **Positioned for Rapid Workflow**: Located directly following the 24-hour vital diagrams.
- **Task Tracking**: Includes scheduled experiment time slots, task completion toggles, and an in-app "Add Activity" dialog.

### 6. Daily Conditioning & Connected Station Hardware Telemetry
Clicking any conditioning metric reveals the operational pipeline and past 5-day historical telemetry:
- **Sleep Duration**: Monitored via the crew member's **Hibernation Pod (#04 Telemetry Array)** with acoustic baffling and polysomnography sleep harness.
- **Exercise Countermeasures**: Read from station exercise avionics, including the **T2 Colbert Treadmill** and **Advanced Resistive Exercise Device (ARED)**.
- **Musculoskeletal Resilience**: Monitored through **ARED strain transducers** and microgravity bio-impedance segmental mesh.
- **Cognitive & Mental State**: Evaluated through regular verbal check-ins and linguistic sentiment analysis via the **AURA Station AI**.
- **Nutritional & Caloric Intake**: Determined from the **Galley Daily Meal Barcode Log** and water dispenser flowmeters.
- **Hardware Telemetry Breakdown**: Sensor status indicators, sub-metric parameters, and direct AI advisory consultation buttons for each system.

### 7. AURA AI Flight Surgeon ("與 AI 通話")
- **Voice-to-Text Conversational Transcript**: Simulates a secure orbital voice comm session with the station's AI medical officer.
- **Gemini-Powered Intelligence**: Uses `@google/genai` to analyze mission logs, suggest countermeasure adaptations, and answer operational health queries.
- **Interactive Action Tools**: AI responses can recommend schedule changes, prescribe electrolyte supplements, or log maintenance items directly.

### 8. Filterable Station Objectives Panel
- **Collapsible Layout**: Can be hidden or maximized using the panel toggle to allow an expansive view of health and activity diagrams.
- **Operations Oversight**: Filter tasks by status (All, Critical, Active, Completed), assign crew members, view module locations, and track progress percentages.

### 9. Orbital Clock & Mission Duration
- Live UTC clock synchronized with station time.
- Automated Mission Elapsed Time (MET) calculation since mission launch (Expedition 72).

---

## 🏗️ Architecture & Technology Stack

### Stack (Unchanged)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Motion
- **Backend / Server**: Node.js, Express, TSX, Vite middlewares
- **AI Integration**: Google Gemini API (`@google/genai`) via server-side `/api/ai-doctor` endpoint (model: `gemini-3.8-flash`)
- **NASA Data**: NASA DONKI Space Weather API (public, no key required beyond DEMO_KEY)
- **Layout / UX**: Clean clinical space-lab light aesthetic, responsive grid and collapsible sidebars, Traditional Chinese UI

### ⭐ New Architecture (coco-demo MVP)

The codebase has been reorganized into clear layers:

```
src/
├── api/                    # API integration layer
│   ├── nasa.ts            # NASA DONKI Space Weather API client
│   └── aiDoctor.ts        # AI Doctor API service with offline fallback
├── components/            # UI components (zh-Hant-TW)
│   ├── SpaceEnvironmentPanel.tsx    # NEW: NASA space environment data display
│   ├── DetailedHealthAnalysis.tsx   # NEW: Two-level health analysis display
│   ├── AiCallModal.tsx              # UPDATED: Supports detailed analysis + zh-Hant-TW
│   ├── AstronautSidebar.tsx
│   ├── DailyRecordsPanel.tsx
│   ├── StationTaskPanel.tsx
│   ├── TopNav.tsx
│   ├── LoginPage.tsx
│   ├── NewTaskModal.tsx
│   ├── AddActivityModal.tsx
│   └── ConditioningDetailCard.tsx
├── data/                  # Mock data and data utilities
│   ├── mockData.ts
│   └── conditioningData.ts
├── utils/                 # Utility functions
│   └── dateUtils.ts
├── types.ts               # TypeScript type definitions
├── App.tsx                # Main application
└── main.tsx               # Entry point

server.ts                  # UPDATED: Added /api/nasa/space-environment endpoint
```

**Key API Endpoints**:
- `POST /api/ai-doctor` - AI health analysis with structured JSON response (overall + detailed metrics/systems)
- `GET /api/nasa/space-environment` - Real-time NASA space weather data (solar flares, geomagnetic storms, CMEs)

**Hardware Telemetry Simulation**:
The README previously referenced hardware telemetry (Hibernation Pod, T2 Colbert, ARED). These are simulated via:
- Mock data in `src/data/mockData.ts` and `src/data/conditioningData.ts`
- No actual hardware sensors are connected (this is a demo/MVP)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- (Optional) `GEMINI_API_KEY` in environment variables for live Gemini AI generation
  - If not set, an intelligent offline AURA flight-surgeon fallback is automatically used
  - The offline fallback provides the same two-level analysis structure (overall + detailed metrics/systems)

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# Optional: Google Gemini API Key for live AI analysis
# Get your key from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional: Application URL (used for deployment metadata)
APP_URL=http://localhost:3000
```

**Important**: 
- Do NOT commit real API keys to the repository
- The app works without `GEMINI_API_KEY` using the offline fallback
- NASA space environment data works without any API key (uses public DEMO_KEY)

### Installation

```bash
# Clone the repository (jeffhong824/space_moni fork)
git clone https://github.com/jeffhong824/space_moni.git
cd space_moni

# Install dependencies (use --legacy-peer-deps if needed)
npm install --legacy-peer-deps
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

## 🧪 Testing the New Features

### 1. NASA Space Environment Data
- **Location**: Left sidebar, below the astronaut profile section
- **What to look for**: 
  - Solar flare classifications (e.g., C2.5, M1.0, X1.2)
  - Geomagnetic Kp index (0-9 scale)
  - Radiation risk level (Low/Moderate/High/Severe)
  - Recent event list (past 7 days)
- **Fallback**: If NASA API is unavailable, you'll see a clear error message explaining the data source is offline

### 2. Detailed AI Health Analysis
- **How to access**: Click "與 AI 通話" (Call with AI) button in the top navigation or daily records panel
- **Initial analysis**: AURA AI provides an initial health assessment on connection
- **Ask questions**: Type or speak questions like:
  - "為什麼我的靜息心率是 103 bpm？" (Why is my resting heart rate 103 bpm?)
  - "我現在可以安全執行植物催化劑實驗嗎？" (Can I safely run the Plant Catalyst experiment now?)
  - "建議補液對策方案。" (Recommend a fluid countermeasure.)
- **View detailed analysis**: Click "詳細健康分析" (Detailed Health Analysis) button to expand:
  - Per-metric analysis: Heart rate, HRV, SpO2, sleep duration
  - Per-system analysis: Cardiovascular, respiratory, sleep, exercise, mental, musculoskeletal, nutrition
- **Execute actions**: Click suggested action buttons to add tasks or log anomalies
- **Offline mode**: Works fully without GEMINI_API_KEY (uses pre-computed medical logic)

### 3. Traditional Chinese UI
- All user-facing text is now in zh-Hant-TW
- Code comments and identifiers remain in English for maintainability
- Git commit messages are in English

## 🔒 Security & Privacy Notice
SpaceMoni adheres to NASA flight medical guidelines: raw 24-hour physiological telemetry waveforms and clinical diagnostics are restricted to NASA Flight Surgeons and the individual astronaut, while station commanders receive high-level mission readiness and duty status summaries.

## 📋 Hackathon Implementation Notes

**Challenge**: "Create Health Monitoring Software for Astronauts on Space Missions"

**Implementation**:
1. ✅ **NASA Public Data Integration**: Real-time space environment monitoring via NASA DONKI API
2. ✅ **Enhanced AI Analysis**: Two-level health assessment (overall + detailed per-metric/system)
3. ✅ **Clean Architecture**: Separated API/data, domain, and UI layers for maintainability
4. ✅ **Traditional Chinese UI**: All user-facing strings in zh-Hant-TW for Taipei event
5. ✅ **Demo Accounts Preserved**: Existing authentication and role-based access maintained
6. ✅ **Build & Lint Pass**: `npm run lint` and `npm run build` both succeed
7. ✅ **Offline Fallback**: AURA AI works without GEMINI_API_KEY, NASA data fails gracefully

**Known Limitations** (Demo/MVP scope):
- Hardware telemetry is simulated (no actual sensor hardware)
- NASA DONKI API has rate limits (~1000 req/hr) but is free and public
- Space Apps Challenge website had HTTP 500 errors during development (did not block implementation)
- No production hardening (authentication is demo-only with default password "12345")
