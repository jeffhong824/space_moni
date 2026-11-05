import React, { useState, useEffect } from 'react';
import { User, Wind, Gauge, Thermometer, ShieldAlert, Users, ChevronDown, Check, Zap, Eye, ShieldCheck, Heart } from 'lucide-react';
import { AstronautProfile, EnvironmentalMetrics, UserRole } from '../types';
import { getStationClockDate, calculateMissionDuration } from '../utils/dateUtils';

interface AstronautSidebarProps {
  currentAstronaut: AstronautProfile;
  allAstronauts: AstronautProfile[];
  onSelectAstronaut: (astronaut: AstronautProfile) => void;
  envMetrics: EnvironmentalMetrics;
  onUpdateEnvMetrics: (updated: Partial<EnvironmentalMetrics>) => void;
  currentUserRole: UserRole;
}

export const AstronautSidebar: React.FC<AstronautSidebarProps> = ({
  currentAstronaut,
  allAstronauts,
  onSelectAstronaut,
  envMetrics,
  onUpdateEnvMetrics,
  currentUserRole,
}) => {
  const [showRoster, setShowRoster] = useState(false);

  // Synchronize Today with the live station clock (UTC)
  const [stationDate, setStationDate] = useState<string>(() => getStationClockDate());

  useEffect(() => {
    const updateDate = () => {
      setStationDate(getStationClockDate());
    };
    updateDate();
    const interval = setInterval(updateDate, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamically calculate duration based on astronaut launch start date and station today date
  const calculatedDuration = calculateMissionDuration(currentAstronaut.missionStartDate, stationDate);

  // Oxygen nominal: 19.5 - 23.1 %, CO2 nominal: < 0.50 %
  const isO2Nominal = envMetrics.oxygenPercent >= 20.0 && envMetrics.oxygenPercent <= 22.5;
  const isCO2Elevated = envMetrics.carbonDioxidePercent > 0.40;

  const isMultiMemberView = currentUserRole === 'Commander' || currentUserRole === 'NASA';

  // Helper for member live status preview
  const getMemberLiveStatus = (id: string) => {
    switch (id) {
      case 'astro-alice':
        return { hr: '103 bpm', status: 'Elevated HR', isAlert: true };
      case 'astro-marcus':
        return { hr: '74 bpm', status: 'Nominal', isAlert: false };
      case 'astro-elena':
        return { hr: '82 bpm', status: 'Nominal', isAlert: false };
      case 'astro-kenji':
        return { hr: '70 bpm', status: 'Nominal', isAlert: false };
      default:
        return { hr: '75 bpm', status: 'Nominal', isAlert: false };
    }
  };

  return (
    <aside className="w-full lg:w-72 xl:w-84 shrink-0 flex flex-col gap-4 p-4 lg:p-5 bg-slate-100/60 border-r border-slate-200/80 overflow-y-auto">
      {/* 
        PERSONAL BLOCK
        - If role is Commander or NASA: Shows list of all members, click to check each member's daily status
        - If role is Astronaut: Shows single astronaut's personal profile (wireframe card)
      */}
      {isMultiMemberView ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Station Crew Roster ({allAstronauts.length})
              </h3>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
              currentUserRole === 'NASA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {currentUserRole === 'NASA' ? 'NASA Oversight' : 'Commander View'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Select any crew member below to inspect their daily situation and telemetry records:
          </p>

          {/* Members List */}
          <div className="space-y-2">
            {allAstronauts.map((astro) => {
              const isSelected = astro.id === currentAstronaut.id;
              const live = getMemberLiveStatus(astro.id);

              return (
                <div
                  key={astro.id}
                  onClick={() => onSelectAstronaut(astro)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-300 shadow-2xs'
                      : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shadow-2xs ${
                        isSelected ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                      }`}>
                        {astro.avatarSeed}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                          <span>{astro.name}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {astro.role} · {astro.stationModule.split(' ')[0]}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded block ${
                        live.isAlert
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {live.hr}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
                        {live.status}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator details if selected */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-sky-200/60 flex items-center justify-between text-[10px] font-mono text-sky-900">
                      <span>DURATION: {calculateMissionDuration(astro.missionStartDate, stationDate).durationText}</span>
                      <span className="font-semibold text-sky-700 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Viewing Records
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Top Card: Astronaut Personal Information (Wireframe cyan/light-blue card) */
        <div className="bg-[#dcf3f8] border border-[#b2e5ef] rounded-2xl p-5 text-slate-800 shadow-xs relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/90 border border-sky-300 flex items-center justify-center font-bold text-sky-800 text-lg shadow-2xs">
                {currentAstronaut.avatarSeed}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {currentAstronaut.name}
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {currentAstronaut.gender}, {currentAstronaut.age}
                </p>
              </div>
            </div>

            <div className="px-2 py-0.5 bg-white/80 border border-sky-200 rounded text-[10px] font-mono font-semibold text-sky-900">
              ASTRONAUT
            </div>
          </div>

          {/* Specialty Role Badge */}
          <div className="inline-block px-2.5 py-1 bg-white/80 border border-sky-200/90 rounded-md text-xs font-semibold text-sky-900 mb-4">
            {currentAstronaut.role}
          </div>

          {/* Mission Timeline & Dates (Strictly matching wireframe) */}
          <div className="space-y-1.5 text-sm font-mono border-t border-sky-200/60 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Start:</span>
              <span className="font-semibold text-slate-900 tabular-nums">{currentAstronaut.missionStartDate}</span>
            </div>
            <div className="flex justify-between items-center text-xs py-0.5 px-1.5 rounded-md hover:bg-sky-100/50 transition-colors">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Station Clock Sync" />
                Today:
              </span>
              <span className="font-semibold text-slate-900 tabular-nums bg-white/75 px-2 py-0.5 rounded border border-sky-200/60 shadow-2xs">
                {stationDate}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-0.5 px-1.5 rounded-md bg-white/60 border border-sky-200/70 shadow-2xs">
              <span className="text-slate-600 font-medium">Duration:</span>
              <span className="font-bold text-sky-950 font-mono tracking-tight">
                {calculatedDuration.durationText}
              </span>
            </div>
          </div>

          {/* Additional contextual station telemetry */}
          <div className="mt-3 pt-2.5 border-t border-sky-200/60 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span>BLOOD: {currentAstronaut.bloodType}</span>
            <span>MOD: {currentAstronaut.stationModule}</span>
          </div>
        </div>
      )}

      {/* Bottom Card: Environmental Metrics (Strictly matching wireframe) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-800 shadow-2xs flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Env. Metrics
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
              ECLSS ACTIVE
            </span>
          </div>

          <div className="space-y-4">
            {/* Oxygen % */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-slate-600">Oxygen %</span>
                <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                  {envMetrics.oxygenPercent.toFixed(1)} %
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(envMetrics.oxygenPercent / 25) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>Min: 19.5%</span>
                <span className="text-emerald-600 font-medium">Target: 20.9%</span>
                <span>Max: 23.5%</span>
              </div>
            </div>

            {/* Carbon Dioxide % */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-slate-600">Carbon Dioxide %</span>
                <span className={`text-base font-bold font-mono tabular-nums ${isCO2Elevated ? 'text-amber-600' : 'text-slate-900'}`}>
                  {envMetrics.carbonDioxidePercent.toFixed(2)} %
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${isCO2Elevated ? 'bg-amber-500' : 'bg-slate-400'}`}
                  style={{ width: `${Math.min(100, (envMetrics.carbonDioxidePercent / 0.8) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>Nominal: &lt;0.35%</span>
                <span className={isCO2Elevated ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                  Alert: &gt;0.50%
                </span>
              </div>
            </div>

            {/* Supplementary station habitat metrics */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase">Pressure</div>
                <div className="font-bold text-slate-800 tabular-nums">{envMetrics.cabinPressureKpa} kPa</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase">Temp</div>
                <div className="font-bold text-slate-800 tabular-nums">{envMetrics.cabinTempCelsius} °C</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase">Radiation</div>
                <div className="font-bold text-slate-800 tabular-nums">{envMetrics.ambientRadiationMsvDay} mSv/d</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase">Humidity</div>
                <div className="font-bold text-slate-800 tabular-nums">{envMetrics.humidityPercent} %</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Scrubber simulation control */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">CO2 Scrubber:</span>
          <button
            onClick={() => {
              const newCO2 = envMetrics.carbonDioxidePercent > 0.32 ? 0.31 : 0.42;
              onUpdateEnvMetrics({ carbonDioxidePercent: newCO2 });
            }}
            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
          >
            {envMetrics.carbonDioxidePercent > 0.35 ? 'Flush Zeolite Bed' : 'Simulate Spike'}
          </button>
        </div>
      </div>
    </aside>
  );
};
