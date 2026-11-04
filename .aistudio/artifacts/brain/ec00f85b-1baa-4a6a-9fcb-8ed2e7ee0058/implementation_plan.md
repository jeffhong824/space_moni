# OrbitalBio Telemetry — Space Station Astronaut Health & Operations Console

A mission-grade biomedical monitoring and station-wide operations platform designed for long-duration orbital habitats. The application provides continuous 24-hour astronaut biometric surveillance, cabin life-support environmental tracking, crew task synchronization, and an interactive voice-enabled AI Station Medical & Operations Officer with actionable tool triggers.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions incorporate the choices confirmed in Phase 1 and define the build specification:

- **Visual Aesthetic & Theme**: Clean clinical space-lab light theme. Built with high-legibility clinical whites (`#FFFFFF`), light aerospace slate surfaces (`#F8FAFC`, `#F1F5F9`), crisp 1px hairline dividers (`border-slate-200/80`), tabular monospace biometrics (`font-mono tabular-nums`), and calibrated precision telemetry accents (cyan `#0284C7`/`#06B6D4`, amber `#D97706`, and clinical emerald `#059669`).
- **Call with AI Experience**: Voice-to-text interactive console featuring real-time speech recognition (via Web Speech API / microphone stream), server-side Gemini 3.8 Flash intelligence, live transcription, audio synthesis feedback, and contextual interactive action cards (e.g., auto-scheduling countermeasures, adjusting module experiments, logging biometric anomalies to station logs).
- **Mission Task Panel**: High-density, filterable multi-module space station task console featuring crew member assignments (with avatars and roles), milestone progress meters, priority rankings, module categorization, and quick-status mutation controls.
- **Wireframe Fidelity**: Precise 3-column spatial architecture matching the attached wireframe (`Astronaut_Personal_d94313c3.png`)—astronaut profile and life-support environmental telemetry on the left, 24-hour daily health timeline and activities in the center with the floating "Call with AI" interface, and the station-wide mission task board on the right.

---

## 1. Overview & Core Concept

### What It Does
OrbitalBio Telemetry bridges personal astronaut physiological monitoring with space station operational execution. Long-duration spaceflight induces significant physiological adaptations (bone mineral loss, cardiovascular deconditioning, microgravity fluid shifts, circadian rhythm disruptions). The application tracks 24-hour vitals (Resting HR, HRV, VO2 Max, SpO2, sleep architecture, musculoskeletal stress), correlates them with habitat environmental metrics (O2, CO2, cabin pressure, ambient radiation), and connects crew members directly with an AI Medical & Mission Officer to triage health deviations and manage station workloads.

### Target Audience & Persona
- **Primary Astronaut Persona**: Alice Smith (Female, 46, Station Botanist, Day 305 of orbital rotation), managing ongoing botanical microgravity experiments while monitoring elevated heart rate and reduced HRV.
- **Secondary Crew & Flight Surgeons**: Multi-crew roster (Commander, Flight Engineer, Systems Specialist) accessing shared station objective progress and environmental telemetry.

### Key Value
Eliminates cognitive overload during long-duration orbital stays by providing immediate situational awareness of personal vitals, station atmospheric stability, and mission task assignments, backed by a voice-driven AI co-pilot that converts spoken medical or operational requests into instant schedule updates and clinical guidance.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Astronaut Profile & Habitat Telemetry (Left Sidebar)**:
   - Crew member profile display (Alice Smith, Age 46, Botanist, Mission Duration: 10 months 2 days, Day 305).
   - Roster selector to inspect other station crew members or compare baseline biometrics.
   - Real-time Environmental Life Support System (ECLSS) panel tracking Oxygen ($O_2$ 20.9%), Carbon Dioxide ($CO_2$ 0.38%), Atmospheric Pressure (101.3 kPa), Cabin Temperature (21.4°C), and Cumulative Radiation Dose rate (0.42 mSv/day) with nominal/elevated threshold alerts.
2. **24-Hour Daily Health & Activity Records (Center Column)**:
   - Chronological daily record cards (2026/11/22 down to 2026/11/18) exactly matching the user wireframe layout.
   - High-density telemetry cards showcasing:
     - **Daily Health Situation**: Resting HR (103 bpm — warning badge for tachycardia), HRV (14 ms — low resilience), VO2 Max ($20.0\text{ mL/kg/min}$), SpO2 ($95\%$).
     - **Daily Aggregates & Systemic State**: Avg Sleep ($305\text{ min}$ / $5.1\text{ hrs}$), Avg Exercise ($175\text{ min}$ / aerobic + resistive cycle), Mental State (Normal / Elevated Cognitive Fatigue), Musculoskeletal (Normal), Nutrition (Normal).
     - **Daily Scheduled Activities**: Numbered research experiments (e.g. *Plant molecular observation*, *Microgravity experiment of plant cells*, *Plant catalyst in space experiment*) with completion checkmarks and time logs.
   - Interactive 24-hour vital scrubber: Clicking any day expands a granular 24-hour sparkline showing heart rate spikes, sleep phases, and exercise intervals with normal vs. abnormal flags.
   - Manual log modal: Allows astronauts to add custom symptom notes, workout logs, or botanical observations.
3. **Station-Wide Mission Task Board (Right Panel)**:
   - Multi-objective station tracker organized by module (Columbus BioLab, Destiny Lab, Kibo Module, Tranquility ECLSS).
   - Filter bar: Filter by priority (Critical, High, Routine), status (In Progress, Scheduled, Completed), or assigned crew member.
   - Live progress bars showing task completion percentages, target deadlines, and assigned astronaut badges.
   - Quick action to mark tasks complete, reassign, or create new mission directives.
4. **Voice & AI Medical / Ops Officer ("Call with AI")**:
   - Floating action trigger at the bottom center of the screen with microphone wave animation.
   - Opens an AI modal: Crew speaks via microphone or enters prompt.
   - Server-side Gemini 3.8 Flash model processes the request with full context of current astronaut vitals, habitat ECLSS, and open station tasks.
   - Outputs instant voice-to-text transcript, audio readback toggle, and executable action buttons:
     - *"Add 30-min Cardiovascular Countermeasure to Task Board"*
     - *"Flag 103 bpm HR spike for Ground Flight Surgeon review"*
     - *"Reschedule Plant Catalyst Experiment to post-sleep cycle"*
     - Clicking any action immediately updates station state!

### Visual Identity & Theme
- **Aesthetic Direction**: Clinical space-lab minimalism. Clean, high-contrast, uncluttered, utilitarian, and ergonomic.
- **Color Palette (60-30-10 Disciplined Space-Lab Palette)**:
  - **60% Dominant Canvas**: Pristine clinical off-white (`#F8FAFC` to `#FFFFFF`) with subtle cool gray background ambiance (`#F1F5F9`).
  - **30% Structural Panels**: Crisp slate containers (`#FFFFFF` with `#E2E8F0` hairline borders), subtle light slate header tabs (`#F8FAFC`), and clean unboxed text metadata.
  - **10% Calibrated Telemetry Accents**:
    - Nominal / Physiological Safe: Clinical Emerald (`#059669` / `#10B981`)
    - Warning / Elevated Anomaly (e.g., HR 103 bpm, Low HRV): Clinical Amber (`#D97706` / `#F59E0B`)
    - Interactive & Active Highlights: Orbital Cyan / Deep Azure (`#0284C7` / `#0EA5E9`)
    - Life Support Gauges: Oxygen Cyan (`#06B6D4`), CO2 Slate Amber (`#B45309`)
- **Typography**:
  - Primary UI & Prose: `Plus Jakarta Sans` or modern clean grotesque sans-serif for crystal clarity.
  - Telemetry, Timestamps & Metrics: Tabular monospace figures (`font-mono tabular-nums`, `font-variant-numeric: tabular-nums`) for jitter-free real-time telemetry.
- **Zero-Pill Discipline**: Metadata displayed as unboxed typography with dot separators (`103 bpm · Resting · Elevated`); interactive filters styled as discrete tab segments rather than candy pills.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Why & Trade-offs |
|---|---|---|
| **AI Integration** | Server-side Gemini 3.8 Flash proxy with structured action dispatching | Provides ultra-fast latency for voice conversational turns while safely executing grounded state actions (task generation, medical logging) without exposing keys to the browser. |
| **Speech-to-Text & Voice Engine** | Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) + server audio synthesis/TTS | Zero external streaming dependencies, instant in-browser microphone capture, smooth fallbacks for text input when ambient noise is high in microgravity. |
| **State Persistence** | React state initialized with authentic space station telemetry + `localStorage` persistence | Instant local hydration, zero network delays for station crew offline operations, and seamless survival across browser reloads. |
| **Layout Architecture** | 3-Column Responsive Grid with sticky left/right docks and scrollable center records | Follows the exact spatial layout of the provided wireframe (`Astronaut_Personal_d94313c3.png`) while adapting gracefully on screens between 1024px and 1920px. |

---

## 4. Technical Architecture & Data Strategy

### System & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Root (App.tsx)                              │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   Header Ribbon: Station Elapsed Time (MET) · Cabin Status     │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌───────────────────┬─────────────────────────┬──────────────────┐   │
│   │   LEFT SIDEBAR    │   CENTER DAILY LOGS     │   RIGHT PANEL    │   │
│   │                   │                         │                  │   │
│   │ ┌───────────────┐ │ ┌─────────────────────┐ │ ┌──────────────┐ │   │
│   │ │ Astronaut Info│ │ │ Date Selector Bar   │ │ │ Task Filter  │ │   │
│   │ │ Alice Smith   │ │ └─────────────────────┘ │ │ & Metrics    │ │   │
│   │ │ Day 305 / 46yo│ │ ┌─────────────────────┐ │ ├──────────────┤ │   │
│   │ ├───────────────┤ │ │ Today's Health Card │ │ │ Mission Task │ │   │
│   │ │ ECLSS Cabin   │ │ │ · HR 103 / HRV 14ms │ │ │ Objectives   │ │   │
│   │ │ Telemetry     │ │ │ · Sleep / Exercise  │ │ │ · BioLab Exp │ │   │
│   │ │ O2: 20.9%     │ │ │ · Daily Activities  │ │ │ · ECLSS Vent │ │   │
│   │ │ CO2: 0.38%    │ │ └─────────────────────┘ │ │ · EVA Prep   │ │   │
│   │ │ Press: 101kPa │ │ ┌─────────────────────┐ │ │ · Crew Avatars│ │   │
│   │ └───────────────┘ │ │ Past Daily Records  │ │ │ · Progress   │ │   │
│   │                   │ │ 2026/11/21 .. 11/18 │ │ └──────────────┘ │   │
│   │                   │ └─────────────────────┘ │                  │   │
│   │                   │ ┌─────────────────────┐ │                  │   │
│   │                   │ │ [Call with AI] Btn  │ │                  │   │
│   │                   │ └──────────┬──────────┘ │                  │   │
│   └───────────────────┴────────────┼────────────┴──────────────────┘   │
│                                    │                                   │
│                        ┌───────────▼───────────┐                       │
│                        │ AI Medical & Ops Modal│                       │
│                        │ · Mic speech-to-text  │                       │
│                        │ · Live transcript     │                       │
│                        │ · Interactive Actions │                       │
│                        └───────────┬───────────┘                       │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                           POST /api/ai-doctor
                                     │
                         ┌───────────▼───────────┐
                         │ Express Server (TS)   │
                         │ GoogleGenAI SDK       │
                         │ (gemini-3.8-flash)    │
                         └───────────────────────┘
```

### Data Models

```typescript
export interface AstronautProfile {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Other';
  age: number;
  role: string;
  missionStartDate: string;
  missionCurrentDate: string;
  missionDuration: string;
  avatarUrl?: string;
  bloodType: string;
  assignedStation: string;
}

export interface DailyHealthRecord {
  date: string; // YYYY/MM/DD
  restingHR: number; // bpm
  restingHRStatus: 'Normal' | 'Elevated' | 'Critical';
  hrv: number; // ms
  vo2Max: number; // mL/kg/min
  spo2: number; // %
  avgSleepMinutes: number;
  avgExerciseMinutes: number;
  mentalStatus: 'Normal' | 'Mild Stress' | 'Fatigued';
  musculoskeletalStatus: 'Normal' | 'Mild Strain' | 'Atrophy Risk';
  nutritionStatus: 'Normal' | 'Calorie Deficit' | 'Dehydrated';
  dailyActivities: { id: string; title: string; completed: boolean; category: string }[];
  hourlyHeartRates?: number[]; // 24-hr sparkline data
  doctorNotes?: string;
}

export interface EnvironmentalMetrics {
  oxygenPercent: number; // e.g. 20.9%
  carbonDioxidePercent: number; // e.g. 0.38%
  cabinPressureKpa: number; // e.g. 101.3
  cabinTempCelsius: number; // e.g. 21.5
  ambientRadiationMsvDay: number; // e.g. 0.42
  airCirculationStatus: 'Nominal' | 'Filtered' | 'Scrubbing';
}

export interface StationTask {
  id: string;
  title: string;
  module: 'Columbus BioLab' | 'Destiny Lab' | 'Kibo Module' | 'Tranquility ECLSS' | 'Station Exterior';
  priority: 'Critical' | 'High' | 'Medium' | 'Routine';
  status: 'In Progress' | 'Scheduled' | 'Completed' | 'Pending Review';
  progress: number; // 0 to 100
  assignedCrew: { name: string; role: string }[];
  deadline: string;
  description: string;
}
```

### Interactive Component & State Mapping
- `AstronautSidebar`: Displays Alice Smith's vitals, profile timeline (Start: 2026/01/21, Today: 2026/11/22, Duration: 10 month 2 days), and ECLSS atmospheric gauges. Includes crew-switcher to inspect co-astronauts.
- `DailyRecordList`: Primary scrollable column rendering day-by-day logs matching the wireframe (2026/11/22 down to 2026/11/18). Clickable cards toggle detailed 24-hour physiological breakdowns with abnormal metric highlights (HR 103 bpm, HRV 14 ms).
- `StationTaskPanel`: Right column displaying filterable space station objectives. Users can filter by priority, module, or assignee, check off completed milestones, and update task progress bars.
- `AiCallModal` ("Call with AI"): Docked or overlay interface triggered by the bottom button. Handles microphone capture, speech-to-text transcription, server-side Gemini 3.8 Flash query with current telemetry payload, and returns actionable interactive tool buttons that mutate tasks and health records in real time.
- `Express Server` (`server.ts`): Implements `/api/ai-doctor` using `@google/genai` with `gemini-3.8-flash` and structured system instructions acting as the Station Medical & Flight Operations AI.
