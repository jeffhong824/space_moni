/**
 * Conditioning Telemetry & Past Historical Data
 * Sources: Hibernation Pod, Exercise Equipment (T2/ARED), Station AI Conversations, Galley Meal Records.
 */

export type ConditioningCategory = 'sleep' | 'exercise' | 'mental' | 'musculoskeletal' | 'nutrition';

export interface ConditioningDetail {
  id: ConditioningCategory;
  title: string;
  shortLabel: string;
  hardwareSource: string;
  sourceDescription: string;
  statusBadge: string;
  statusColor: 'emerald' | 'sky' | 'indigo' | 'amber' | 'rose';
  primaryMetric: {
    label: string;
    value: string;
    benchmark: string;
    subtext: string;
  };
  pastDaysData: {
    date: string;
    displayDate: string;
    value: number;
    formattedValue: string;
    status: 'Nominal' | 'Optimal' | 'Alert' | 'Elevated';
    note: string;
  }[];
  hardwareSensors: {
    label: string;
    value: string;
    status: 'Nominal' | 'Active' | 'Synced' | 'Calibrated';
  }[];
  detailedBreakdown: {
    category: string;
    items: { name: string; val: string; desc?: string }[];
  };
  aiInsight: string;
}

export const CONDITIONING_DETAILS: Record<ConditioningCategory, ConditioningDetail> = {
  sleep: {
    id: 'sleep',
    title: 'Sleep Duration & Circadian Cycle',
    shortLabel: 'Sleep Duration',
    hardwareSource: "Astronaut Hibernation Pod #04 · Crew Quarters Node 2",
    sourceDescription: "Connected directly to the astronaut's Hibernation Pod telemetry array (acoustic baffling, microgravity restraint sensors, infrared thermography, and polysomnography harness).",
    statusBadge: 'Pod Sync Active',
    statusColor: 'indigo',
    primaryMetric: {
      label: 'Average Pod Sleep Duration',
      value: '305 min (5.1 hrs)',
      benchmark: 'Target: 420-480 min (7-8 hrs)',
      subtext: 'Mild chronic sleep deprivation detected from orbital daylight shifts',
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: 'Today (11/22)', value: 305, formattedValue: '5h 05m', status: 'Alert', note: 'cond.note.sleep.n0' },
      { date: '2026/11/21', displayDate: 'Yesterday (11/21)', value: 380, formattedValue: '6h 20m', status: 'Nominal', note: 'cond.note.sleep.n1' },
      { date: '2026/11/20', displayDate: 'Nov 20', value: 425, formattedValue: '7h 05m', status: 'Optimal', note: 'cond.note.sleep.n2' },
      { date: '2026/11/19', displayDate: 'Nov 19', value: 395, formattedValue: '6h 35m', status: 'Nominal', note: 'cond.note.sleep.n3' },
      { date: '2026/11/18', displayDate: 'Nov 18', value: 340, formattedValue: '5h 40m', status: 'Alert', note: 'cond.note.sleep.n4' },
    ],
    hardwareSensors: [
      { label: 'Pod Acoustic Isolation', value: '38.4 dB (Quiet)', status: 'Nominal' },
      { label: 'Circadian Light Cycle', value: '450nm Dusk Mode', status: 'Active' },
      { label: 'Pod Temperature', value: '19.4 °C (Set 19.5)', status: 'Nominal' },
      { label: 'EEG / Polysomnography Harness', value: '99.2% Signal', status: 'Synced' },
    ],
    detailedBreakdown: {
      category: 'Sleep Architecture Breakdown',
      items: [
        { name: 'Slow-Wave Deep Sleep', val: '92 min', desc: 'Cellular tissue recovery & metabolic reset' },
        { name: 'REM Sleep', val: '84 min', desc: 'Memory consolidation & neurocognitive processing' },
        { name: 'Light Sleep Stages', val: '129 min', desc: 'Microgravity float stabilization' },
        { name: 'Micro-Arousals Logged', val: '3 events', desc: 'Acoustic spike from Progress spacecraft thruster test' },
      ],
    },
    aiInsight: "Hibernation Pod telemetry indicates sleep efficiency is 81.4%. Recommending 15 minutes of dim-light transition protocol and melatonin schedule before next rest cycle.",
  },

  exercise: {
    id: 'exercise',
    title: 'Exercise Countermeasures & Mechanical Work',
    shortLabel: 'Exercise Countermeasure',
    hardwareSource: "Space Station Exercise Equipment Network (T2 Colbert Treadmill & ARED)",
    sourceDescription: "Monitored by connecting to space station exercise equipment avionics (COLBERT T2 treadmill telemetry bus, ARED resistive vacuum cylinders, and CEVIS cycle ergometer load sensors).",
    statusBadge: 'Equipment Bus Linked',
    statusColor: 'emerald',
    primaryMetric: {
      label: 'Total Countermeasure Duration',
      value: '175 min (2.9 hrs)',
      benchmark: 'NASA Protocol: 150 min/day',
      subtext: '116% protocol compliance to prevent microgravity osteopenia',
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: 'Today (11/22)', value: 175, formattedValue: '175 min', status: 'Optimal', note: 'cond.note.exercise.n0' },
      { date: '2026/11/21', displayDate: 'Yesterday (11/21)', value: 150, formattedValue: '150 min', status: 'Nominal', note: 'cond.note.exercise.n1' },
      { date: '2026/11/20', displayDate: 'Nov 20', value: 140, formattedValue: '140 min', status: 'Nominal', note: 'cond.note.exercise.n2' },
      { date: '2026/11/19', displayDate: 'Nov 19', value: 165, formattedValue: '165 min', status: 'Nominal', note: 'cond.note.exercise.n3' },
      { date: '2026/11/18', displayDate: 'Nov 18', value: 180, formattedValue: '180 min', status: 'Optimal', note: 'cond.note.exercise.n4' },
    ],
    hardwareSensors: [
      { label: 'ARED Vacuum Cylinder Load', value: '240 kg Peak', status: 'Calibrated' },
      { label: 'T2 Vibration Isolation (VIS)', value: '0.002 G (Damped)', status: 'Nominal' },
      { label: 'CEVIS Flywheel Encoder', value: '210 Watts', status: 'Active' },
      { label: 'Bungee Bungee Harness Tension', value: '68% Bodyweight', status: 'Synced' },
    ],
    detailedBreakdown: {
      category: 'Workload & Ergometer Output',
      items: [
        { name: 'ARED Resistive Lifting', val: '65 min', desc: '14,200 kg total mechanical volume displaced' },
        { name: 'T2 Colbert Aerobic Run', val: '60 min', desc: '8.4 km covered with vibration damping active' },
        { name: 'CEVIS Cycle Ergometer', val: '50 min', desc: 'Aerobic heart rate maintenance in Zone 3' },
        { name: 'Total Energy Expended', val: '845 kcal', desc: 'Direct mechanical work measured by strain gauges' },
      ],
    },
    aiInsight: "Cardiovascular response shows resting tachycardia after today's 175-min workout. Advised oral rehydration salts prior to Columbus BioLab research.",
  },

  mental: {
    id: 'mental',
    title: 'Cognitive & Mental State Assessment',
    shortLabel: 'Cognitive & Mental State',
    hardwareSource: "AURA Station AI Natural Language & Vocal Biometrics Engine",
    sourceDescription: "Initially assessed based on regular verbal conversations with the space station's onboard AI (acoustic frequency analysis, semantic coherence, reaction latency, and sentiment telemetry).",
    statusBadge: 'AI Speech Engine Active',
    statusColor: 'sky',
    primaryMetric: {
      label: 'Neuro-Cognitive Status',
      value: 'Normal / Stable',
      benchmark: 'Standard: Coherent & Focused',
      subtext: 'Linguistic sentiment 94% positive; mild acute fatigue from workload',
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: 'Today (11/22)', value: 88, formattedValue: 'Normal (88/100)', status: 'Nominal', note: 'cond.note.mental.n0' },
      { date: '2026/11/21', displayDate: 'Yesterday (11/21)', value: 92, formattedValue: 'Optimal (92/100)', status: 'Optimal', note: 'cond.note.mental.n1' },
      { date: '2026/11/20', displayDate: 'Nov 20', value: 95, formattedValue: 'Optimal (95/100)', status: 'Optimal', note: 'cond.note.mental.n2' },
      { date: '2026/11/19', displayDate: 'Nov 19', value: 90, formattedValue: 'Normal (90/100)', status: 'Nominal', note: 'cond.note.mental.n3' },
      { date: '2026/11/18', displayDate: 'Nov 18', value: 85, formattedValue: 'Normal (85/100)', status: 'Nominal', note: 'cond.note.mental.n4' },
    ],
    hardwareSensors: [
      { label: 'Acoustic Voice Stress Analyzer', value: '11% (Low Stress)', status: 'Nominal' },
      { label: 'Response Latency Tracker', value: '215 ms (Fast)', status: 'Synced' },
      { label: 'Semantic Coherence Index', value: '99.4%', status: 'Nominal' },
      { label: 'AI Voice Consultations', value: '4 check-ins logged', status: 'Active' },
    ],
    detailedBreakdown: {
      category: 'AI Cognitive Diagnostic Markers',
      items: [
        { name: 'Vocal Micro-Tremor Index', val: 'Low (11%)', desc: 'No signs of acute neuro-vestibular distress' },
        { name: 'Speech Cadence Rate', val: '142 wpm', desc: 'Natural pacing consistent with Earth baseline' },
        { name: 'Psychomotor Vigilance (PVT)', val: '198 ms', desc: 'Zero reaction lapses during safety check' },
        { name: 'Cognitive Workload Index', val: 'Moderate', desc: 'Concentrated effort on Plant Catalyst experiment' },
      ],
    },
    aiInsight: "Voice sentiment remains psychologically robust and mission-ready. Recommended 10 minutes of Earth observation cupola downtime to sustain morale.",
  },

  musculoskeletal: {
    id: 'musculoskeletal',
    title: 'Musculoskeletal Resilience & Density',
    shortLabel: 'Musculoskeletal Resilience',
    hardwareSource: "ARED In-Situ Strain Telemetry & Bio-Impedance Sensor Array",
    sourceDescription: "Monitored by connecting to space station exercise equipment load sensors and wearable bio-impedance strips reading past muscular contractile force and bone density indicators.",
    statusBadge: 'Biomech Sensors Synced',
    statusColor: 'amber',
    primaryMetric: {
      label: 'Musculoskeletal Resilience',
      value: 'Normal / Protected',
      benchmark: 'Retention Target: >95%',
      subtext: 'High compliance with resistive loading has prevented disuse atrophy',
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: 'Today (11/22)', value: 96, formattedValue: '96.2%', status: 'Nominal', note: 'cond.note.msk.n0' },
      { date: '2026/11/21', displayDate: 'Yesterday (11/21)', value: 96, formattedValue: '96.4%', status: 'Nominal', note: 'cond.note.msk.n1' },
      { date: '2026/11/20', displayDate: 'Nov 20', value: 97, formattedValue: '96.8%', status: 'Optimal', note: 'cond.note.msk.n2' },
      { date: '2026/11/19', displayDate: 'Nov 19', value: 96, formattedValue: '96.3%', status: 'Nominal', note: 'cond.note.msk.n3' },
      { date: '2026/11/18', displayDate: 'Nov 18', value: 96, formattedValue: '96.0%', status: 'Nominal', note: 'cond.note.msk.n4' },
    ],
    hardwareSensors: [
      { label: 'ARED Load Cell Transducers', value: '1,840 N Peak', status: 'Calibrated' },
      { label: 'Leg Bio-Impedance Mesh', value: 'Nominal Tone', status: 'Active' },
      { label: 'Spinal Elongation Tracker', value: '+2.1 cm (Normal Zero-G)', status: 'Nominal' },
      { label: 'Bone Mineral Flux Telemetry', value: '-0.04% / mo (Minimal)', status: 'Synced' },
    ],
    detailedBreakdown: {
      category: 'Biomechanical Diagnostics',
      items: [
        { name: 'Isometric Squat Output', val: '1,840 N', desc: 'Direct axial load applied to femoral neck and spine' },
        { name: 'Calf Circumference Delta', val: '-1.2 mm', desc: 'Standard microgravity cephalad fluid redistribution' },
        { name: 'Bone Mineral Retention', val: '98.8%', desc: 'Protected by daily high-strain cyclic loading' },
        { name: 'Post-Workout Muscle Soreness', val: 'Mild (Grade 1)', desc: 'Eccentric hamstring activation from treadmill' },
      ],
    },
    aiInsight: "Musculoskeletal parameters remain exemplary for Day 305 of long-duration orbital flight. Countermeasure protocol is successfully halting bone demineralization.",
  },

  nutrition: {
    id: 'nutrition',
    title: 'Nutritional Balance & Galley Caloric Intake',
    shortLabel: 'Nutrition & Caloric Intake',
    hardwareSource: "Space Station Galley Food Intake Computer & Hydration Telemetry",
    sourceDescription: "Determined by referring to daily meal records of the space station galley barcode inventory and calculating caloric distribution, micro-nutrients, and electrolyte hydration status.",
    statusBadge: 'Galley Inventory Logged',
    statusColor: 'rose',
    primaryMetric: {
      label: 'Daily Caloric Fulfillment',
      value: '2,740 kcal (Normal)',
      benchmark: 'Caloric Target: 2,800 kcal',
      subtext: '98% caloric fulfillment with sodium and electrolyte regulation',
    },
    pastDaysData: [
      { date: '2026/11/22', displayDate: 'Today (11/22)', value: 2740, formattedValue: '2,740 kcal', status: 'Nominal', note: 'cond.note.nutrition.n0' },
      { date: '2026/11/21', displayDate: 'Yesterday (11/21)', value: 2810, formattedValue: '2,810 kcal', status: 'Optimal', note: 'cond.note.nutrition.n1' },
      { date: '2026/11/20', displayDate: 'Nov 20', value: 2680, formattedValue: '2,680 kcal', status: 'Nominal', note: 'cond.note.nutrition.n2' },
      { date: '2026/11/19', displayDate: 'Nov 19', value: 2790, formattedValue: '2,790 kcal', status: 'Nominal', note: 'cond.note.nutrition.n3' },
      { date: '2026/11/18', displayDate: 'Nov 18', value: 2840, formattedValue: '2,840 kcal', status: 'Optimal', note: 'cond.note.nutrition.n4' },
    ],
    hardwareSensors: [
      { label: 'Galley Barcode Scanner', value: '4 meals logged', status: 'Active' },
      { label: 'Potable Water Dispenser (PWD)', value: '2,450 mL Drawn', status: 'Nominal' },
      { label: 'Pouch Shelf Life Scanner', value: 'All Lots Nominal', status: 'Synced' },
      { label: 'Metabolic Balance Algorithm', value: 'Equilibrium (±2%)', status: 'Calibrated' },
    ],
    detailedBreakdown: {
      category: 'Macronutrient & Micronutrient Breakdown',
      items: [
        { name: 'Protein Intake', val: '112 g', desc: 'Sufficient amino acid supply for muscle maintenance' },
        { name: 'Fluid & Hydration', val: '2,450 mL', desc: 'Isotonic water intake to offset cardiovascular fluid shifts' },
        { name: 'Sodium (Salt) Restriction', val: '2,850 mg', desc: 'Kept below threshold to prevent bone calcium excretion' },
        { name: 'Vitamin D3 & Calcium Pouch', val: '1,000 IU logged', desc: 'Counteracting zero-solar cabin radiation exposure' },
      ],
    },
    aiInsight: "Caloric intake is on target. Because resting heart rate is elevated today, an additional 250 mL of oral electrolyte solution is prescribed before sleeping.",
  },
};
