import { AstronautProfile, EnvironmentalMetrics, DailyHealthRecord, StationTask, HourlyVitalPoint, AuthUser } from '../types';

export const PRESET_ACCOUNTS: AuthUser[] = [
  {
    account: 'alice_smith',
    name: 'Alice Smith',
    role: 'Astronaut',
    astronautId: 'astro-alice',
    title: 'Station Botanist',
  },
  {
    account: 'marcus_vance',
    name: 'Marcus Vance',
    role: 'Commander',
    astronautId: 'astro-marcus',
    title: 'Station Commander',
  },
  {
    account: 'nasa_mission_control',
    name: 'NASA Flight Surgeon',
    role: 'NASA',
    title: 'NASA Flight Surgeon & Bio-Medical Ground Control',
  },
  {
    account: 'elena_rostova',
    name: 'Elena Rostova',
    role: 'Astronaut',
    astronautId: 'astro-elena',
    title: 'ECLSS Systems Specialist',
  },
  {
    account: 'kenji_sato',
    name: 'Kenji Sato',
    role: 'Astronaut',
    astronautId: 'astro-kenji',
    title: 'Avionics & Flight Surgeon',
  },
];

export const INITIAL_ASTRONAUTS: AstronautProfile[] = [
  {
    id: 'astro-alice',
    name: 'Alice Smith',
    gender: 'Female',
    age: 46,
    role: 'Botanist',
    missionStartDate: '2026/01/21',
    missionCurrentDate: '2026/11/22',
    missionDuration: '10 month 2 days',
    missionDaysElapsed: 305,
    bloodType: 'A Rh+',
    assignedStation: 'ISS Orbital Sector 4',
    stationModule: 'Columbus BioLab',
    avatarSeed: 'AS',
  },
  {
    id: 'astro-marcus',
    name: 'Marcus Vance',
    gender: 'Male',
    age: 51,
    role: 'Station Commander',
    missionStartDate: '2026/01/21',
    missionCurrentDate: '2026/11/22',
    missionDuration: '10 month 2 days',
    missionDaysElapsed: 305,
    bloodType: 'O Rh+',
    assignedStation: 'ISS Orbital Sector 4',
    stationModule: 'Destiny Command',
    avatarSeed: 'MV',
  },
  {
    id: 'astro-elena',
    name: 'Elena Rostova',
    gender: 'Female',
    age: 39,
    role: 'ECLSS Systems Specialist',
    missionStartDate: '2026/03/10',
    missionCurrentDate: '2026/11/22',
    missionDuration: '8 month 12 days',
    missionDaysElapsed: 257,
    bloodType: 'B Rh+',
    assignedStation: 'ISS Orbital Sector 4',
    stationModule: 'Tranquility Node 3',
    avatarSeed: 'ER',
  },
  {
    id: 'astro-kenji',
    name: 'Kenji Sato',
    gender: 'Male',
    age: 42,
    role: 'Flight Surgeon & Avionics',
    missionStartDate: '2026/01/21',
    missionCurrentDate: '2026/11/22',
    missionDuration: '10 month 2 days',
    missionDaysElapsed: 305,
    bloodType: 'AB Rh+',
    assignedStation: 'ISS Orbital Sector 4',
    stationModule: 'Kibo Laboratory',
    avatarSeed: 'KS',
  },
];

export const INITIAL_ENVIRONMENT: EnvironmentalMetrics = {
  oxygenPercent: 20.9,
  carbonDioxidePercent: 0.38,
  cabinPressureKpa: 101.3,
  cabinTempCelsius: 21.4,
  ambientRadiationMsvDay: 0.42,
  humidityPercent: 44.5,
  airScrubberState: 'Active Regeneration',
};

export const TODAY_24H_VITALS: HourlyVitalPoint[] = [
  { hour: '00:00', hr: 68, spo2: 97, hrv: 28, activityNote: 'Sleep / Circadian rest in Crew Quarters', isAbnormal: false },
  { hour: '02:00', hr: 64, spo2: 97, hrv: 32, activityNote: 'Slow-Wave Deep Sleep cycle', isAbnormal: false },
  { hour: '04:00', hr: 62, spo2: 98, hrv: 34, activityNote: 'REM Sleep cycle / Baseline metabolic low', isAbnormal: false },
  { hour: '06:00', hr: 74, spo2: 96, hrv: 26, activityNote: 'Station lighting dawn simulation & Wakeup', isAbnormal: false },
  { hour: '08:00', hr: 84, spo2: 96, hrv: 22, activityNote: 'Breakfast & Morning Telemetry Conference with CAPCOM', isAbnormal: false },
  { hour: '10:00', hr: 89, spo2: 96, hrv: 20, activityNote: 'Plant molecular observation in Columbus BioLab', isAbnormal: false },
  { hour: '12:00', hr: 104, spo2: 94, hrv: 15, activityNote: 'Microgravity experiment prep — fluid shift onset detected', isAbnormal: true },
  { hour: '14:00', hr: 114, spo2: 94, hrv: 12, activityNote: 'Intensive T2 Treadmill + ARED Countermeasures (Peak Load)', isAbnormal: true },
  { hour: '16:00', hr: 103, spo2: 95, hrv: 14, activityNote: 'Post-exercise resting tachycardia & Plant catalyst run', isAbnormal: true },
  { hour: '18:00', hr: 96, spo2: 95, hrv: 18, activityNote: 'Hydroponic nutrient solution exchange', isAbnormal: false },
  { hour: '20:00', hr: 86, spo2: 96, hrv: 22, activityNote: 'Dinner with crew & Station systems debrief', isAbnormal: false },
  { hour: '22:00', hr: 76, spo2: 96, hrv: 26, activityNote: 'Pre-sleep relaxation & Biometric harness calibration', isAbnormal: false },
];

// Generates 24-hr heart rate points with simulated peaks
const generate24HrVitals = (baseHr: number, spikeHours: number[] = [14, 16]) => {
  const points = [];
  const routineNotes = [
    'Crew quarters sleep',
    'Deep sleep',
    'REM sleep',
    'Station dawn',
    'Morning briefing',
    'BioLab research',
    'Module maintenance',
    'Treadmill exercise',
    'Sample assay',
    'Clean room check',
    'Evening meal',
    'Pre-sleep rest'
  ];
  for (let i = 0; i < 24; i += 2) {
    const isSpike = spikeHours.includes(i);
    const hrVal = isSpike ? baseHr + 20 + Math.floor(Math.random() * 6) : baseHr + Math.floor(Math.random() * 6) - 3;
    const isAbnormal = hrVal > 100;
    points.push({
      hour: `${String(i).padStart(2, '0')}:00`,
      hr: hrVal,
      spo2: isSpike ? 94 : 96 + (Math.random() > 0.5 ? 1 : 0),
      hrv: isAbnormal ? 15 : 26 + Math.floor(Math.random() * 6),
      activityNote: routineNotes[i / 2] || 'Station operation',
      isAbnormal,
    });
  }
  return points;
};

export const INITIAL_DAILY_RECORDS: DailyHealthRecord[] = [
  {
    date: '2026/11/22',
    isToday: true,
    restingHR: 103,
    restingHRStatus: 'Elevated',
    hrv: 14,
    vo2Max: 20.0,
    spo2: 95,
    avgSleepMinutes: 305,
    avgExerciseMinutes: 175,
    mentalStatus: 'Normal',
    musculoskeletalStatus: 'Normal',
    nutritionStatus: 'Normal',
    clinicalObservations: 'Cardiovascular response shows resting tachycardia (103 bpm) and suppressed autonomic tone (HRV 14 ms). SpO2 stable at 95%. Correlates with intensive 175m treadmill session and microgravity fluid translocation.',
    dailyActivities: [
      { id: 'act-1', title: 'Plant molecular observation', completed: true, timeSlot: '08:30 - 11:00', category: 'Research' },
      { id: 'act-2', title: 'Microgravity experiment of plant cells', completed: true, timeSlot: '12:00 - 14:30', category: 'Research' },
      { id: 'act-3', title: 'Plant catalyst in space experiment', completed: false, timeSlot: '16:00 - 18:30', category: 'Research' },
    ],
    hourlyTimeline: TODAY_24H_VITALS,
  },
  {
    date: '2026/11/21',
    restingHR: 88,
    restingHRStatus: 'Normal',
    hrv: 21,
    vo2Max: 20.2,
    spo2: 96,
    avgSleepMinutes: 380,
    avgExerciseMinutes: 150,
    mentalStatus: 'Normal',
    musculoskeletalStatus: 'Normal',
    nutritionStatus: 'Normal',
    clinicalObservations: 'Cardiovascular recovery following aerobic countermeasure. Sleep duration improved to 6.3 hours.',
    dailyActivities: [
      { id: 'act-21-1', title: 'BioLab nutrient manifold check', completed: true, timeSlot: '09:00 - 11:00', category: 'Maintenance' },
      { id: 'act-21-2', title: 'Arabidopsis seed pod imaging', completed: true, timeSlot: '13:00 - 15:30', category: 'Research' },
      { id: 'act-21-3', title: 'Resistive exercise device (ARED) cycle', completed: true, timeSlot: '16:30 - 18:00', category: 'Health Countermeasure' },
    ],
    hourlyTimeline: generate24HrVitals(84, [16]),
  },
  {
    date: '2026/11/20',
    restingHR: 76,
    restingHRStatus: 'Normal',
    hrv: 30,
    vo2Max: 20.4,
    spo2: 98,
    avgSleepMinutes: 425,
    avgExerciseMinutes: 140,
    mentalStatus: 'Normal',
    musculoskeletalStatus: 'Normal',
    nutritionStatus: 'Normal',
    clinicalObservations: 'Optimal physiological readings. Resting heart rate at 76 bpm with strong autonomic balance.',
    dailyActivities: [
      { id: 'act-20-1', title: 'Hydroponic pH equilibrium assay', completed: true, timeSlot: '08:00 - 10:30', category: 'Research' },
      { id: 'act-20-2', title: 'Cryo-freezer sample relocation', completed: true, timeSlot: '11:15 - 12:45', category: 'Research' },
      { id: 'act-20-3', title: 'T2 Cycle Ergometer with Vibration Isolation', completed: true, timeSlot: '15:00 - 16:30', category: 'Health Countermeasure' },
    ],
    hourlyTimeline: generate24HrVitals(75, [15]),
  },
  {
    date: '2026/11/19',
    restingHR: 79,
    restingHRStatus: 'Normal',
    hrv: 26,
    vo2Max: 20.3,
    spo2: 97,
    avgSleepMinutes: 395,
    avgExerciseMinutes: 165,
    mentalStatus: 'Normal',
    musculoskeletalStatus: 'Normal',
    nutritionStatus: 'Normal',
    clinicalObservations: 'Biometrics nominal. Electrolyte hydration compliance at 100%.',
    dailyActivities: [
      { id: 'act-19-1', title: 'Columbus European Drawer Rack calibration', completed: true, timeSlot: '09:00 - 11:30', category: 'Maintenance' },
      { id: 'act-19-2', title: 'Microscopic cellular density count', completed: true, timeSlot: '13:00 - 15:00', category: 'Research' },
      { id: 'act-19-3', title: 'Capsule teleconference with ground science team', completed: true, timeSlot: '17:00 - 18:00', category: 'Operation' },
    ],
    hourlyTimeline: generate24HrVitals(78, [14]),
  },
  {
    date: '2026/11/18',
    restingHR: 82,
    restingHRStatus: 'Normal',
    hrv: 24,
    vo2Max: 20.1,
    spo2: 96,
    avgSleepMinutes: 340,
    avgExerciseMinutes: 180,
    mentalStatus: 'Normal',
    musculoskeletalStatus: 'Normal',
    nutritionStatus: 'Normal',
    clinicalObservations: 'High physical exertion recorded on resistive cycle. Sleep fragmentation noted due to station docking acoustic event.',
    dailyActivities: [
      { id: 'act-18-1', title: 'Plant gravitropism initial seed placement', completed: true, timeSlot: '08:30 - 12:00', category: 'Research' },
      { id: 'act-18-2', title: 'Bio-waste loop purge and sterilize', completed: true, timeSlot: '13:30 - 15:00', category: 'Maintenance' },
      { id: 'act-18-3', title: 'Acoustic dosimeter survey in Kibo module', completed: true, timeSlot: '16:00 - 17:30', category: 'Operation' },
    ],
    hourlyTimeline: generate24HrVitals(80, [13, 17]),
  },
];

export const INITIAL_STATION_TASKS: StationTask[] = [
  {
    id: 'tsk-01',
    title: 'Plant catalyst in space experiment',
    module: 'Columbus BioLab',
    priority: 'High',
    status: 'In Progress',
    progress: 68,
    assignedCrew: [
      { name: 'Alice Smith', role: 'Botanist', avatarBg: 'bg-cyan-600' },
    ],
    deadline: 'Today, 18:30 UTC',
    description: 'Monitor cellular enzyme reactions in zero-g growth chambers under blue light spectra.',
  },
  {
    id: 'tsk-02',
    title: 'Microgravity experiment of plant cells',
    module: 'Columbus BioLab',
    priority: 'High',
    status: 'In Progress',
    progress: 85,
    assignedCrew: [
      { name: 'Alice Smith', role: 'Botanist', avatarBg: 'bg-cyan-600' },
      { name: 'Kenji Sato', role: 'Flight Surgeon', avatarBg: 'bg-indigo-600' },
    ],
    deadline: 'Today, 21:00 UTC',
    description: 'Observe cell membrane wall fluidity and mitochondrial division without gravity vector.',
  },
  {
    id: 'tsk-03',
    title: 'Tranquility ECLSS CO2 Scrubber Desiccant Bed Flush',
    module: 'Tranquility ECLSS',
    priority: 'Critical',
    status: 'In Progress',
    progress: 42,
    assignedCrew: [
      { name: 'Elena Rostova', role: 'ECLSS Specialist', avatarBg: 'bg-emerald-600' },
      { name: 'Marcus Vance', role: 'Commander', avatarBg: 'bg-slate-700' },
    ],
    deadline: 'Today, 23:00 UTC',
    description: 'Regenerate zeolite sorption bed 2 to keep ambient cabin CO2 below 0.40% threshold.',
  },
  {
    id: 'tsk-04',
    title: 'Ka-Band High-Gain Antenna Transceiver Diagnostics',
    module: 'Station Exterior',
    priority: 'Medium',
    status: 'Scheduled',
    progress: 15,
    assignedCrew: [
      { name: 'Marcus Vance', role: 'Commander', avatarBg: 'bg-slate-700' },
    ],
    deadline: 'Tomorrow, 08:00 UTC',
    description: 'Inspect signal attenuation during tracking and data relay satellite handoff.',
  },
  {
    id: 'tsk-05',
    title: 'Plant molecular observation cycle 4',
    module: 'Columbus BioLab',
    priority: 'Routine',
    status: 'Completed',
    progress: 100,
    assignedCrew: [
      { name: 'Alice Smith', role: 'Botanist', avatarBg: 'bg-cyan-600' },
    ],
    deadline: 'Completed 11:00 UTC',
    description: 'Fluorescence microscopy recording completed and archived to ISS science repository.',
  },
  {
    id: 'tsk-06',
    title: 'Kibo Airlock Depressurization Pre-Check for NanoSat Deploy',
    module: 'Kibo Module',
    priority: 'Medium',
    status: 'Scheduled',
    progress: 30,
    assignedCrew: [
      { name: 'Kenji Sato', role: 'Avionics', avatarBg: 'bg-indigo-600' },
    ],
    deadline: '2026/11/24, 14:00 UTC',
    description: 'Verify vacuum seal integrity on multi-purpose experiment platform slide table.',
  },
  {
    id: 'tsk-07',
    title: 'ARED Resistive Exercise Cable Tension Verification',
    module: 'Tranquility ECLSS',
    priority: 'Routine',
    status: 'Completed',
    progress: 100,
    assignedCrew: [
      { name: 'Elena Rostova', role: 'ECLSS Specialist', avatarBg: 'bg-emerald-600' },
    ],
    deadline: 'Completed 06:45 UTC',
    description: 'Calibration load cells recalibrated for high-load squat countermeasure routines.',
  },
];

// Helper to provide realistic daily health records for any selected astronaut
export const getAstronautDailyRecords = (astronautId: string): DailyHealthRecord[] => {
  if (astronautId === 'astro-alice') {
    return INITIAL_DAILY_RECORDS;
  }

  if (astronautId === 'astro-marcus') {
    return [
      {
        date: '2026/11/22',
        isToday: true,
        restingHR: 74,
        restingHRStatus: 'Normal',
        hrv: 32,
        vo2Max: 24.8,
        spo2: 98,
        avgSleepMinutes: 440,
        avgExerciseMinutes: 160,
        mentalStatus: 'Normal',
        musculoskeletalStatus: 'Normal',
        nutritionStatus: 'Normal',
        clinicalObservations: 'Commander biometrics optimal. Strong autonomic resilience and resting tone.',
        dailyActivities: [
          { id: 'act-m1', title: 'Destiny Laboratory Ka-Band diagnostics', completed: true, timeSlot: '08:00 - 10:30', category: 'Maintenance' },
          { id: 'act-m2', title: 'Station orbital altitude thruster fire review', completed: true, timeSlot: '11:00 - 13:00', category: 'Operation' },
          { id: 'act-m3', title: 'Quest Airlock EVA pressure suit valve inspection', completed: false, timeSlot: '15:30 - 18:00', category: 'Maintenance' },
        ],
        hourlyTimeline: TODAY_24H_VITALS.map(p => ({
          ...p,
          hr: Math.round(p.hr * 0.76),
          isAbnormal: false,
          activityNote: `Commander Station Ops (${p.hour})`
        })),
      },
      {
        date: '2026/11/21',
        restingHR: 72,
        restingHRStatus: 'Normal',
        hrv: 34,
        vo2Max: 24.9,
        spo2: 98,
        avgSleepMinutes: 450,
        avgExerciseMinutes: 155,
        mentalStatus: 'Normal',
        musculoskeletalStatus: 'Normal',
        nutritionStatus: 'Normal',
        dailyActivities: [
          { id: 'act-m21', title: 'Weekly mission status debrief with Houston', completed: true, timeSlot: '10:00 - 12:00', category: 'Operation' },
          { id: 'act-m22', title: 'T2 Treadmill high-speed interval countermeasure', completed: true, timeSlot: '14:00 - 15:30', category: 'Health Countermeasure' },
        ],
        hourlyTimeline: TODAY_24H_VITALS.map(p => ({ ...p, hr: 72 + Math.floor(Math.random() * 8), isAbnormal: false })),
      },
      {
        date: '2026/11/20',
        restingHR: 76,
        restingHRStatus: 'Normal',
        hrv: 30,
        vo2Max: 24.6,
        spo2: 97,
        avgSleepMinutes: 420,
        avgExerciseMinutes: 150,
        mentalStatus: 'Normal',
        musculoskeletalStatus: 'Normal',
        nutritionStatus: 'Normal',
        dailyActivities: [
          { id: 'act-m20', title: 'Robotics Canadarm2 joint friction calibration', completed: true, timeSlot: '09:00 - 12:30', category: 'Operation' },
        ],
        hourlyTimeline: TODAY_24H_VITALS.map(p => ({ ...p, hr: 74 + Math.floor(Math.random() * 8), isAbnormal: false })),
      },
    ];
  }

  if (astronautId === 'astro-elena') {
    return [
      {
        date: '2026/11/22',
        isToday: true,
        restingHR: 82,
        restingHRStatus: 'Normal',
        hrv: 26,
        vo2Max: 22.1,
        spo2: 97,
        avgSleepMinutes: 375,
        avgExerciseMinutes: 165,
        mentalStatus: 'Normal',
        musculoskeletalStatus: 'Normal',
        nutritionStatus: 'Normal',
        clinicalObservations: 'ECLSS technician vitals steady. Mild physical fatigue from zeolite sorption bed manual torque.',
        dailyActivities: [
          { id: 'act-e1', title: 'Tranquility CO2 Scrubber Desiccant Bed Flush', completed: true, timeSlot: '08:30 - 12:00', category: 'Maintenance' },
          { id: 'act-e2', title: 'Oxygen Generation Assembly (OGA) cell voltage verification', completed: true, timeSlot: '13:00 - 15:00', category: 'Maintenance' },
          { id: 'act-e3', title: 'Water Recovery System condensate recycle check', completed: false, timeSlot: '16:30 - 18:30', category: 'Maintenance' },
        ],
        hourlyTimeline: TODAY_24H_VITALS.map(p => ({
          ...p,
          hr: Math.round(p.hr * 0.84),
          isAbnormal: p.hour === '14:00',
          activityNote: `ECLSS Systems (${p.hour})`
        })),
      },
    ];
  }

  // Kenji Sato
  return [
    {
      date: '2026/11/22',
      isToday: true,
      restingHR: 70,
      restingHRStatus: 'Normal',
      hrv: 35,
      vo2Max: 23.4,
      spo2: 99,
      avgSleepMinutes: 460,
      avgExerciseMinutes: 140,
      mentalStatus: 'Normal',
      musculoskeletalStatus: 'Normal',
      nutritionStatus: 'Normal',
      clinicalObservations: 'Flight surgeon self-monitoring nominal. Neurological and vestibular adaptation 100%.',
      dailyActivities: [
        { id: 'act-k1', title: 'Kibo Airlock slide table vacuum seal verification', completed: true, timeSlot: '09:00 - 11:30', category: 'Maintenance' },
        { id: 'act-k2', title: 'Crew vestibular balance and motion assay collection', completed: true, timeSlot: '13:00 - 14:30', category: 'Research' },
        { id: 'act-k3', title: 'NanoSat orbital deploy telemetry synchronization', completed: false, timeSlot: '16:00 - 18:00', category: 'Operation' },
      ],
      hourlyTimeline: TODAY_24H_VITALS.map(p => ({
        ...p,
        hr: Math.round(p.hr * 0.72),
        isAbnormal: false,
        activityNote: `Avionics & Medical (${p.hour})`
      })),
    },
  ];
};

