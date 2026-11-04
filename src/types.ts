export type UserRole = 'Astronaut' | 'Commander' | 'NASA';

export interface AuthUser {
  account: string; // e.g. "alice_smith", "marcus_vance", "nasa_flight_surgeon"
  name: string;
  role: UserRole;
  astronautId?: string;
  title: string;
}

export interface AstronautProfile {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Other';
  age: number;
  role: string;
  missionStartDate: string; // e.g. "2026/01/21"
  missionCurrentDate: string; // e.g. "2026/11/22"
  missionDuration: string; // e.g. "10 month 2 days"
  missionDaysElapsed: number; // 305
  bloodType: string;
  assignedStation: string;
  stationModule: string;
  avatarSeed: string;
}

export interface EnvironmentalMetrics {
  oxygenPercent: number; // e.g. 20.9
  carbonDioxidePercent: number; // e.g. 0.38
  cabinPressureKpa: number; // e.g. 101.3
  cabinTempCelsius: number; // e.g. 21.4
  ambientRadiationMsvDay: number; // e.g. 0.42
  humidityPercent: number; // e.g. 46
  airScrubberState: 'Nominal' | 'Active Regeneration' | 'Scrubbing';
}

export interface DailyActivityItem {
  id: string;
  title: string;
  completed: boolean;
  timeSlot?: string;
  category?: 'Research' | 'Maintenance' | 'Health Countermeasure' | 'Operation';
}

export interface HourlyVitalPoint {
  hour: string; // e.g. "00:00", "04:00"
  hr: number;
  spo2: number;
  hrv?: number;
  activityNote?: string;
  isAbnormal?: boolean;
}

export interface DailyHealthRecord {
  date: string; // "2026/11/22"
  isToday?: boolean;
  restingHR: number; // bpm
  restingHRStatus: 'Normal' | 'Elevated' | 'Critical';
  hrv: number; // ms
  vo2Max: number; // mL/kg/min
  spo2: number; // %
  avgSleepMinutes: number; // e.g. 305
  avgExerciseMinutes: number; // e.g. 175
  mentalStatus: 'Normal' | 'Elevated Stress' | 'Fatigued';
  musculoskeletalStatus: 'Normal' | 'Mild Strain' | 'Atrophy Risk';
  nutritionStatus: 'Normal' | 'Calorie Deficit' | 'Dehydration';
  dailyActivities: DailyActivityItem[];
  hourlyTimeline: HourlyVitalPoint[];
  clinicalObservations?: string;
}

export interface StationTask {
  id: string;
  title: string;
  module: 'Columbus BioLab' | 'Destiny Lab' | 'Kibo Module' | 'Tranquility ECLSS' | 'Station Exterior';
  priority: 'Critical' | 'High' | 'Medium' | 'Routine';
  status: 'In Progress' | 'Scheduled' | 'Completed' | 'Pending Review';
  progress: number; // 0 - 100
  assignedCrew: { name: string; role: string; avatarBg: string }[];
  deadline: string;
  description: string;
}

export interface AiMessage {
  id: string;
  sender: 'astronaut' | 'aura';
  timestamp: string;
  text: string;
  audioPlaying?: boolean;
  suggestedActions?: {
    id: string;
    label: string;
    type: 'ADD_TASK' | 'LOG_ANOMALY' | 'UPDATE_VITALS' | 'NOTIFY_MISSION_CONTROL';
    payload?: any;
    executed?: boolean;
  }[];
  healthAssessment?: {
    status: 'Nominal' | 'Attention Required' | 'Critical';
    summary: string;
  };
}
