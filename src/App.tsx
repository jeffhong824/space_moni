import React, { useState, useEffect, useCallback } from 'react';
import { TopNav, type AppView } from './components/TopNav';
import { AstronautSidebar } from './components/AstronautSidebar';
import { DailyRecordsPanel } from './components/DailyRecordsPanel';
import { StationTaskPanel } from './components/StationTaskPanel';
import { AiCallModal } from './components/AiCallModal';
import { NewTaskModal } from './components/NewTaskModal';
import { AddActivityModal } from './components/AddActivityModal';
import { LoginPage } from './components/LoginPage';
import { SpaceEnvironmentPanel } from './components/SpaceEnvironmentPanel';
import { AstronautHome } from './components/AstronautHome';
import { CommanderHome } from './components/CommanderHome';
import { SurgeonHome } from './components/SurgeonHome';
import { DataSourcesPage } from './components/DataSourcesPage';
import {
  INITIAL_ASTRONAUTS,
  INITIAL_ENVIRONMENT,
  INITIAL_STATION_TASKS,
  getAstronautDailyRecords,
} from './data/mockData';
import {
  AstronautProfile,
  EnvironmentalMetrics,
  DailyHealthRecord,
  StationTask,
  DailyActivityItem,
  AuthUser,
} from './types';
import { CheckCircle2 } from 'lucide-react';
import { overlayDemoSpe, type SpaceEnvironmentPayload } from './domain/spaceWeather';
import type { SelfCheckEntry } from './domain/healthThresholds';
import type { CaseMeta } from './domain/clinicalCases';

function initialRecordsMap(): Record<string, DailyHealthRecord[]> {
  const map: Record<string, DailyHealthRecord[]> = {};
  for (const astro of INITIAL_ASTRONAUTS) {
    map[astro.id] = getAstronautDailyRecords(astro.id);
  }
  return map;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<AppView>('home');
  const [astronauts] = useState<AstronautProfile[]>(INITIAL_ASTRONAUTS);
  const [selectedAstronaut, setSelectedAstronaut] = useState<AstronautProfile>(INITIAL_ASTRONAUTS[0]);

  const [envMetrics, setEnvMetrics] = useState<EnvironmentalMetrics>(() => {
    const saved = localStorage.getItem('orbital_env_metrics');
    return saved ? JSON.parse(saved) : INITIAL_ENVIRONMENT;
  });

  const [recordsByAstronaut, setRecordsByAstronaut] = useState<Record<string, DailyHealthRecord[]>>(initialRecordsMap);
  const [selfChecks, setSelfChecks] = useState<Record<string, SelfCheckEntry | undefined>>({});
  const [caseMeta, setCaseMeta] = useState<Record<string, CaseMeta>>({});

  const [stationTasks, setStationTasks] = useState<StationTask[]>(() => {
    const saved = localStorage.getItem('orbital_station_tasks');
    return saved ? JSON.parse(saved) : INITIAL_STATION_TASKS;
  });

  const [selectedDate, setSelectedDate] = useState<string>('2026/11/22');
  const [isAiCallOpen, setIsAiCallOpen] = useState<boolean>(false);
  const [aiCallInitialPrompt, setAiCallInitialPrompt] = useState<string>('');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [activityModalDate, setActivityModalDate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);
  const [spaceEnvironment, setSpaceEnvironment] = useState<SpaceEnvironmentPayload | null>(null);
  const [spaceEnvLoading, setSpaceEnvLoading] = useState(true);
  const [spaceEnvError, setSpaceEnvError] = useState<string | null>(null);
  const [speDemo, setSpeDemo] = useState(false);

  const dailyRecords = recordsByAstronaut[selectedAstronaut.id] || [];

  const patchRecords = (astronautId: string, updater: (prev: DailyHealthRecord[]) => DailyHealthRecord[]) => {
    setRecordsByAstronaut((prev) => ({
      ...prev,
      [astronautId]: updater(prev[astronautId] || getAstronautDailyRecords(astronautId)),
    }));
  };

  const handleOpenAiCall = (prompt?: string) => {
    setAiCallInitialPrompt(prompt || '');
    setIsAiCallOpen(true);
  };

  const handleSelectAstronaut = (astro: AstronautProfile) => {
    setSelectedAstronaut(astro);
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setView('home');
    if (user.role === 'Astronaut') {
      const astro = astronauts.find((a) => a.id === user.astronautId) || astronauts[0];
      handleSelectAstronaut(astro);
    } else if (user.role === 'Commander') {
      const commanderAstro = astronauts.find((a) => a.id === 'astro-marcus') || astronauts[1];
      handleSelectAstronaut(commanderAstro);
    } else {
      handleSelectAstronaut(astronauts[0]);
    }
    const roleZh = user.role === 'NASA' ? 'NASA 飛行外科醫師' : user.role === 'Commander' ? '指揮官' : '太空人';
    showToast(`已登入：${user.name}（${roleZh}）`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
  };

  useEffect(() => {
    localStorage.setItem('orbital_env_metrics', JSON.stringify(envMetrics));
  }, [envMetrics]);

  useEffect(() => {
    localStorage.setItem('orbital_station_tasks', JSON.stringify(stationTasks));
  }, [stationTasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleActivity = (date: string, activityId: string) => {
    patchRecords(selectedAstronaut.id, (prev) =>
      prev.map((rec) => {
        if (rec.date === date) {
          return {
            ...rec,
            dailyActivities: rec.dailyActivities.map((act) =>
              act.id === activityId ? { ...act, completed: !act.completed } : act
            ),
          };
        }
        return rec;
      })
    );
  };

  const handleAddActivity = (date: string, item: DailyActivityItem) => {
    patchRecords(selectedAstronaut.id, (prev) =>
      prev.map((rec) => {
        if (rec.date === date) {
          return { ...rec, dailyActivities: [...rec.dailyActivities, item] };
        }
        return rec;
      })
    );
    showToast(`已新增活動至 ${date}`);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setStationTasks((prev) =>
      prev.map((tsk) => {
        if (tsk.id === taskId) {
          const isDone = tsk.status === 'Completed';
          return {
            ...tsk,
            status: isDone ? 'In Progress' : 'Completed',
            progress: isDone ? 50 : 100,
          };
        }
        return tsk;
      })
    );
  };

  const handleUpdateTaskProgress = (taskId: string, newProgress: number) => {
    setStationTasks((prev) =>
      prev.map((tsk) => {
        if (tsk.id === taskId) {
          return {
            ...tsk,
            progress: newProgress,
            status: newProgress >= 100 ? 'Completed' : tsk.status,
          };
        }
        return tsk;
      })
    );
  };

  const handleAddTask = (newTask: StationTask) => {
    setStationTasks((prev) => [newTask, ...prev]);
    showToast(`已新增任務：「${newTask.title}」`);
  };

  const handleExecuteAiAction = (action: { type: string; label: string; payload?: Record<string, string> }) => {
    if (action.type === 'ADD_TASK') {
      const payload = action.payload || {};
      const newTask: StationTask = {
        id: 'tsk-' + Date.now(),
        title: payload.title || action.label,
        module: (payload.module as StationTask['module']) || 'Tranquility ECLSS',
        priority: (payload.priority as StationTask['priority']) || 'High',
        status: 'In Progress',
        progress: 0,
        assignedCrew: [
          {
            name: selectedAstronaut.name,
            role: selectedAstronaut.role,
            avatarBg: 'bg-cyan-600',
          },
        ],
        deadline: 'Today, +1h',
        description: payload.description || `AURA 排程對策：${action.label}`,
      };
      setStationTasks((prev) => [newTask, ...prev]);
      showToast(`AURA 已排程任務：「${newTask.title}」`);
    } else if (action.type === 'LOG_ANOMALY') {
      const note = action.payload?.note || action.label;
      patchRecords(selectedAstronaut.id, (prev) =>
        prev.map((rec) => {
          if (rec.isToday || rec.date === '2026/11/22') {
            return {
              ...rec,
              clinicalObservations: rec.clinicalObservations
                ? `${rec.clinicalObservations} [AURA Note: ${note}]`
                : `[AURA Note: ${note}]`,
            };
          }
          return rec;
        })
      );
      showToast('已將臨床註記寫入今日健康紀錄');
    }
  };

  const loadWx = useCallback(async (refresh = false) => {
    setSpaceEnvLoading(true);
    setSpaceEnvError(null);
    try {
      const res = await fetch(`/api/nasa/space-environment${refresh ? '?refresh=1' : ''}`);
      const json = (await res.json()) as SpaceEnvironmentPayload & { error?: string };
      if (!res.ok && json.overallStatus === 'unavailable') {
        setSpaceEnvironment(json);
        setSpaceEnvError(json.error || '官方饋送無法使用');
        return;
      }
      if (!res.ok) {
        setSpaceEnvError(json.error || `HTTP ${res.status}`);
        return;
      }
      setSpaceEnvironment(json);
    } catch (err: unknown) {
      setSpaceEnvError(err instanceof Error ? err.message : '無法連接空間天氣服務');
    } finally {
      setSpaceEnvLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWx(false);
    const id = window.setInterval(() => void loadWx(false), 60 * 1000);
    return () => window.clearInterval(id);
  }, [loadWx]);

  const displayWx = speDemo ? overlayDemoSpe(spaceEnvironment) : spaceEnvironment;

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const todayRecord =
    dailyRecords.find((r) => r.isToday || r.date === '2026/11/22') || dailyRecords[0];

  const roleHome =
    currentUser.role === 'Commander' ? (
      <CommanderHome
        astronauts={astronauts}
        recordsByAstronaut={recordsByAstronaut}
        selfChecks={selfChecks}
        tasks={stationTasks}
        spaceEnvironment={displayWx}
        speDemo={speDemo}
        onSelectAstronaut={handleSelectAstronaut}
        onOpenConsole={() => setView('console')}
      />
    ) : currentUser.role === 'NASA' ? (
      <SurgeonHome
        surgeonName={currentUser.name}
        astronauts={astronauts}
        recordsByAstronaut={recordsByAstronaut}
        selfChecks={selfChecks}
        caseMeta={caseMeta}
        onUpdateCase={(id, patch) =>
          setCaseMeta((prev) => ({
            ...prev,
            [id]: {
              state: patch.state ?? prev[id]?.state ?? 'open',
              physicianNotes: patch.physicianNotes ?? prev[id]?.physicianNotes ?? [],
            },
          }))
        }
        envMetrics={envMetrics}
        spaceEnvironment={displayWx}
        speDemo={speDemo}
        onSelectAstronaut={handleSelectAstronaut}
        onOpenConsole={() => setView('console')}
      />
    ) : (
      <AstronautHome
        astronaut={selectedAstronaut}
        todayRecord={todayRecord}
        selfCheck={selfChecks[selectedAstronaut.id] ?? null}
        onSaveSelfCheck={(entry) => {
          setSelfChecks((prev) => ({ ...prev, [selectedAstronaut.id]: entry }));
          showToast('自我檢核已寫入分析');
        }}
        tasks={stationTasks}
        onToggleActivity={handleToggleActivity}
        onToggleTaskStatus={handleToggleTaskStatus}
        onOpenAiCall={handleOpenAiCall}
        onOpenConsole={() => setView('console')}
        spaceEnvironment={displayWx}
        speDemo={speDemo}
      />
    );

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
      <a
        href="#main-records"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:px-3 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow"
      >
        跳到健康紀錄
      </a>
      <TopNav
        envMetrics={envMetrics}
        onOpenAiCall={() => handleOpenAiCall()}
        currentUser={currentUser}
        onLogout={handleLogout}
        isRightPanelCollapsed={isRightPanelCollapsed}
        onToggleRightPanel={() => setIsRightPanelCollapsed((prev) => !prev)}
        view={view}
        onChangeView={setView}
        speDemo={speDemo}
        onToggleSpeDemo={() => setSpeDemo((v) => !v)}
      />

      {view === 'home' && roleHome}
      {view === 'sources' && <DataSourcesPage onBack={() => setView('home')} />}
      {view === 'console' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <aside className="w-full lg:w-[21rem] xl:w-[22.5rem] shrink-0 flex flex-col overflow-y-auto bg-slate-50/90 border-r border-slate-200/90">
            <AstronautSidebar
              currentAstronaut={selectedAstronaut}
              allAstronauts={astronauts}
              onSelectAstronaut={handleSelectAstronaut}
              envMetrics={envMetrics}
              onUpdateEnvMetrics={(updated) => setEnvMetrics((prev) => ({ ...prev, ...updated }))}
              currentUserRole={currentUser.role}
              recordsByAstronaut={recordsByAstronaut}
            />
            <div className="px-4 pb-5">
              <SpaceEnvironmentPanel
                payload={displayWx}
                loading={spaceEnvLoading}
                error={spaceEnvError}
                onRefresh={() => void loadWx(true)}
                speDemo={speDemo}
              />
            </div>
          </aside>

          <DailyRecordsPanel
            records={dailyRecords}
            onToggleActivity={handleToggleActivity}
            onOpenAddActivity={(date) => setActivityModalDate(date)}
            onOpenAiCall={handleOpenAiCall}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            currentUserRole={currentUser.role}
            currentAstronaut={selectedAstronaut}
            isRightPanelCollapsed={isRightPanelCollapsed}
            onToggleRightPanel={() => setIsRightPanelCollapsed((prev) => !prev)}
          />

          <StationTaskPanel
            tasks={stationTasks}
            onToggleTaskStatus={handleToggleTaskStatus}
            onUpdateTaskProgress={handleUpdateTaskProgress}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            isCollapsed={isRightPanelCollapsed}
            onToggleCollapse={() => setIsRightPanelCollapsed((prev) => !prev)}
          />
        </div>
      )}

      <AiCallModal
        isOpen={isAiCallOpen}
        onClose={() => {
          setIsAiCallOpen(false);
          setAiCallInitialPrompt('');
        }}
        astronaut={selectedAstronaut}
        todayRecord={todayRecord}
        envMetrics={envMetrics}
        tasks={stationTasks}
        onExecuteAction={handleExecuteAiAction}
        initialPrompt={aiCallInitialPrompt}
        spaceEnvironment={displayWx}
        selfCheck={selfChecks[selectedAstronaut.id] ?? null}
      />

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onAddTask={handleAddTask}
        astronauts={astronauts}
      />

      <AddActivityModal
        isOpen={activityModalDate !== null}
        onClose={() => setActivityModalDate(null)}
        date={activityModalDate || '2026/11/22'}
        onAddActivity={handleAddActivity}
      />

      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-medium animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
