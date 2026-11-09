# SpaceMoni — 軌道生物遙測與太空站作業控制台

**SpaceMoni (coco-demo)** is an orbital bio-telemetry and space station operations monitoring console designed for astronaut crews, orbital commanders, and ground-based NASA flight surgeons. It combines continuous physiological tracking, multi-system hardware telemetry pipelines, daily experiment schedules, and mission task management with an integrated **AURA AI Flight Surgeon** powered by Google Gemini.

**2026 NASA Space Apps Challenge - Taipei Local Event**  
**Team: OGTech AI**  
**Challenge: "Create Health Monitoring Software for Astronauts on Space Missions"**

This is a product-grade demo console:
- Official space-environment observations from NOAA SWPC / GOES, plus NASA DONKI when reachable
- Two-level AI health analysis (overall + per-metric/system) with documented thresholds
- Traditional Chinese (zh-Hant-TW) user interface
- Clear provenance: live official feeds vs simulated crew telemetry — nothing is silently faked

---

## 🛰️ Key Features (新增功能標記 ⭐)

### 1. 官方空間環境監測（不編造即時資料）
作業台顯示**有出處、有時間戳、有單位**的空間天氣，供組員／臨床人員把健康遙測對照外部環境。

**即時觀測（無需金鑰）— NOAA Space Weather Prediction Center / GOES**
NASA 任務作業實際使用的官方美國空間天氣來源。本環境中 NASA DONKI 常逾時，因此即時 Kp、X 射線通量、太陽風與質子通量以 SWPC／GOES 為準。

| 資料 | 端點 | 單位 |
| --- | --- | --- |
| 行星 Kp（1 分鐘） | `https://services.swpc.noaa.gov/json/planetary_k_index_1m.json` | Kp |
| GOES X 射線（0.1–0.8 nm） | `https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json` | W/m² → GOES class |
| 太陽風速 | `https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json` | km/s |
| GOES ≥10 MeV 積分質子 | `https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json` | pfu |
| SWPC 警報 | `https://services.swpc.noaa.gov/products/alerts.json` | 原文標題 |

文件：<https://www.swpc.noaa.gov/> 、NOAA Scales <https://www.swpc.noaa.gov/noaa-scales-explanation>

**事件目錄（可選 NASA 金鑰）— NASA DONKI**
- `https://api.nasa.gov/DONKI/FLR|GST|CME`
- 環境變數 `NASA_API_KEY`；未設定則使用公開 `DEMO_KEY`，UI 顯示**非營運金鑰**提示
- 逾時、HTTP 錯誤或 7 日空窗會明白標示；**不會填補閃焰／CME**

伺服器端點：`GET /api/nasa/space-environment`（60 秒記憶體快取；`?refresh=1` 強制重抓）

輻射風險由觀測推估 NOAA G／R／S 尺度，並在 UI 寫明依據。艙內 O₂／CO₂／氣壓為**示範 ECLSS**，與官方空間天氣分開標示。

### 2. 雙層級 AI 健康分析（打包＋固定門檻）
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

**Offline Fallback**: When `GEMINI_API_KEY` is unset or Gemini fails, the same packed two-level structure is produced by `src/domain/healthPacking.ts`.

**Documented demo thresholds** (`src/domain/healthThresholds.ts`): 靜息心率 50–90 bpm 正常、>100 危急；HRV ≥25 ms 正常、<20 危急；SpO₂ ≥96% 正常、<94 危急；睡眠 ≥420 min 正常。這是示範臨床政策，不是 NASA 認證協議。生理來源一律標示為模擬機組遙測。

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
- **Space environment**: NOAA SWPC / GOES live observations + NASA DONKI catalog (optional `NASA_API_KEY`)
- **Layout / UX**: Clinical space-lab light identity, Noto Sans TC, focus rings, empty/loading/error states, Traditional Chinese UI

### ⭐ New Architecture (coco-demo MVP)

The codebase has been reorganized into clear layers:

```
src/
├── domain/                # Thresholds, packing, space-weather types
│   ├── healthThresholds.ts
│   ├── healthPacking.ts
│   └── spaceWeather.ts
├── server/                # Server-only official feed client
│   └── fetchSpaceEnvironment.ts
├── api/                   # Browser API clients
│   └── aiDoctor.ts
├── ui/                    # Shared status / empty / error primitives
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
- `POST /api/ai-doctor` — packed telemetry + optional space-weather snapshot; returns overall + per-metric/system analysis
- `GET /api/nasa/space-environment` — NOAA SWPC/GOES observations + NASA DONKI catalog with provenance

**What is live vs simulated**
- **Live / official**: NOAA SWPC Kp, GOES X-rays, solar wind, protons, SWPC alerts; NASA DONKI events when the catalog responds
- **Simulated demo**: crew vitals, 24h waveforms, Hibernation Pod / T2 / ARED / galley logs, cabin ECLSS gauges
- The UI labels simulated sources so they cannot be mistaken for NASA telemetry

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

# Optional: NASA DONKI catalog key (live NOAA feeds do not need this)
NASA_API_KEY=DEMO_KEY

# Optional: Application URL (used for deployment metadata)
APP_URL=http://localhost:3000
```

**Important**:
- Do NOT commit real API keys
- AURA works without `GEMINI_API_KEY` (offline two-level engine)
- NOAA SWPC / GOES work with no key
- `NASA_API_KEY=DEMO_KEY` is non-production and is disclosed in the UI

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

### 1. Official space environment
- Left sidebar, 「官方空間環境」
- Expect Kp, GOES class, solar wind km/s, proton pfu, timestamps, source latency
- DONKI may be empty or timed out — that is shown, not fabricated
- DEMO_KEY notice appears until a real `NASA_API_KEY` is set

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
1. Official NOAA SWPC / GOES observations with provenance; NASA DONKI catalog when reachable
2. Two-level health analysis with shared thresholds in `src/domain/healthThresholds.ts`
3. Domain / API / UI layers; simulated telemetry never labelled as NASA live data
4. Product-grade zh-Hant-TW console: hierarchy, loading/empty/error, focus, reduced-motion
5. Demo accounts and roles preserved
6. `npm run lint` and `npm run build` must pass
7. Offline AURA fallback uses the same packed two-level structure

**Known limitations**
- Crew health and cabin ECLSS remain **simulated demonstration data**, clearly labelled
- NASA DONKI may time out; live operations use NOAA SWPC / GOES
- `DEMO_KEY` is rate-limited and shown as non-production
- Authentication is still demo-only (password `12345`)
