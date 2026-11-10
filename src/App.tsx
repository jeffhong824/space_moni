import React, { Suspense, lazy, useState, useEffect, useCallback, useMemo } from 'react';
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
import { HqConsole } from './components/HqConsole';
import {
  AstronautProfile,
  DailyHealthRecord,
  StationTask,
  DailyActivityItem,
  AuthUser,
} from './types';
import { CheckCircle2 } from 'lucide-react';
import { overlayDemoSpe, type SpaceEnvironmentPayload } from './domain/spaceWeather';
import type { SelfCheckEntry } from './domain/healthThresholds';
import type { CaseMeta } from './domain/clinicalCases';
import { useI18n } from './i18n/I18nProvider';
import { CREW, crewByLogin } from './world/catalog';
import { historyRecords, tasksForShip, worldStateAt } from './world/worldState';
import { allProfiles, crewToProfile, enrichUser, profilesForShip } from './world/toProfiles';

const SimWorldPage = lazy(() => import('./sim/SimWorldPage').then((m) => ({ default: m.SimWorldPage })));

function usePath() {
  const [path, setPath] = useState(() => (typeof window === 'undefined' ? '/' : window.location.pathname));
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export default function App() {
  const { t } = useI18n();
  const path = usePath();
  const [now, setNow] = useState(() => Date.now());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<AppView>('home');
  const [selectedAstronaut, setSelectedAstronaut] = useState<AstronautProfile>(() => crewToProfile(CREW[1], Date.now()));
  const [selfChecks, setSelfChecks] = useState<Record<string, SelfCheckEntry | undefined>>({});
  const [caseMeta, setCaseMeta] = useState<Record<string, CaseMeta>>({});
  const [extraTasks, setExtraTasks] = useState<StationTask[]>(() => {
    try {
      const saved = localStorage.getItem('orbital_station_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAiCallOpen, setIsAiCallOpen] = useState(false);
  const [aiCallInitialPrompt, setAiCallInitialPrompt] = useState('');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [activityModalDate, setActivityModalDate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [spaceEnvironment, setSpaceEnvironment] = useState<SpaceEnvironmentPayload | null>(null);
  const [spaceEnvLoading, setSpaceEnvLoading] = useState(true);
  const [spaceEnvError, setSpaceEnvError] = useState<string | null>(null);
  const [speDemo, setSpeDemo] = useState(false);
  const [activityOverrides, setActivityOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const displayWx = speDemo ? overlayDemoSpe(spaceEnvironment) : spaceEnvironment;
  const world = useMemo(() => worldStateAt(now, displayWx), [now, displayWx]);

  const myCrew = currentUser ? crewByLogin(currentUser.account) : undefined;
  const myShipId = myCrew?.shipId;
  const astronauts = useMemo(() => {
    if (!currentUser) return allProfiles(now);
    if (currentUser.role === 'NASA') return allProfiles(now);
    if (myShipId) return profilesForShip(myShipId, now);
    return allProfiles(now);
  }, [currentUser, myShipId, now]);

  const selectedShip = world.ships.find((s) => s.crew.some((c) => c.def.id === selectedAstronaut.id)) ?? world.ships[0];
  const envMetrics = selectedShip.cabin;

  const dailyRecords = useMemo(() => {
    const def = CREW.find((c) => c.id === selectedAstronaut.id);
    if (!def) return [];
    const recs = historyRecords(def, now, displayWx);
    return recs.map((rec) => ({
      ...rec,
      dailyActivities: rec.dailyActivities.map((a) => ({
        ...a,
        title: a.title.startsWith('act.') ? t(a.title) : a.title,
        completed: activityOverrides[`${def.id}:${a.id}`] ?? a.completed,
      })),
    }));
  }, [selectedAstronaut.id, now, displayWx, activityOverrides, t]);

  const stationTasks = useMemo(() => {
    const generated = selectedShip ? tasksForShip(selectedShip, now) : [];
    const labeled = generated.map((task) => ({
      ...task,
      title: task.title.startsWith('act.') ? t(task.title) : task.title,
      description: task.description.startsWith('act.') ? t(task.description) : task.description,
    }));
    return [...extraTasks, ...labeled];
  }, [selectedShip, now, extraTasks, t]);

  const recordsByAstronaut = useMemo(() => {
    const map: Record<string, DailyHealthRecord[]> = {};
    for (const a of astronauts) {
      const def = CREW.find((c) => c.id === a.id);
      if (def) map[a.id] = historyRecords(def, now, displayWx);
    }
    return map;
  }, [astronauts, now, displayWx]);

  const patchRecordsComplete = (date: string, activityId: string) => {
    setActivityOverrides((prev) => {
      const key = `${selectedAstronaut.id}:${activityId}`;
      return { ...prev, [key]: !(prev[key] ?? false) };
    });
  };

  const handleOpenAiCall = (prompt?: string) => {
    setAiCallInitialPrompt(prompt || '');
    setIsAiCallOpen(true);
  };

  const handleSelectAstronaut = (astro: AstronautProfile) => {
    setSelectedAstronaut(astro);
  };

  const handleLogin = (user: AuthUser) => {
    const enriched = enrichUser(user);
    setCurrentUser(enriched);
    setView(enriched.role === 'NASA' ? 'hq' : 'home');
    const crew = crewByLogin(enriched.account);
    if (crew) setSelectedAstronaut(crewToProfile(crew, now));
    else if (enriched.role === 'NASA') setSelectedAstronaut(crewToProfile(CREW[1], now));
    const roleZh =
      enriched.role === 'NASA' ? t('role.nasa') : enriched.role === 'Commander' ? t('role.commander') : t('role.astronaut');
    showToast(t('nav.loggedIn', { name: enriched.name, role: roleZh }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
  };

  useEffect(() => {
    localStorage.setItem('orbital_station_tasks', JSON.stringify(extraTasks));
  }, [extraTasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleActivity = (date: string, activityId: string) => {
    patchRecordsComplete(date, activityId);
  };

  const handleAddActivity = (date: string, item: DailyActivityItem) => {
    showToast(t('toast.activityAdded', { date }));
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setExtraTasks((prev) =>
      prev.map((tsk) =>
        tsk.id === taskId
          ? { ...tsk, status: tsk.status === 'Completed' ? 'In Progress' : 'Completed', progress: tsk.status === 'Completed' ? 50 : 100 }
          : tsk
      )
    );
  };

  const handleUpdateTaskProgress = (taskId: string, newProgress: number) => {
    setExtraTasks((prev) =>
      prev.map((tsk) => (tsk.id === taskId ? { ...tsk, progress: newProgress, status: newProgress >= 100 ? 'Completed' : tsk.status } : tsk))
    );
  };

  const handleAddTask = (newTask: StationTask) => {
    setExtraTasks((prev) => [newTask, ...prev]);
    showToast(t('toast.taskAdded', { title: newTask.title }));
  };

  const handleExecuteAiAction = (action: { type: string; label: string; payload?: Record<string, string> }) => {
    if (action.type === 'ADD_TASK') {
      const payload = action.payload || {};
      const newTask: StationTask = {
        id: 'tsk-' + Date.now(),
        title: payload.title || action.label,
        module: payload.module || 'mod.tranquility',
        priority: (payload.priority as StationTask['priority']) || 'High',
        status: 'In Progress',
        progress: 0,
        assignedCrew: [{ name: selectedAstronaut.name, role: selectedAstronaut.role, avatarBg: 'bg-cyan-600' }],
        deadline: 'Today, +1h',
        description: payload.description || action.label,
      };
      setExtraTasks((prev) => [newTask, ...prev]);
      showToast(t('toast.auraTask', { title: newTask.title }));
    } else if (action.type === 'LOG_ANOMALY') {
      showToast(t('toast.noteLogged'));
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
        setSpaceEnvError(json.error || t('wx.fail'));
        return;
      }
      if (!res.ok) {
        setSpaceEnvError(json.error || `HTTP ${res.status}`);
        return;
      }
      setSpaceEnvironment(json);
    } catch (err: unknown) {
      setSpaceEnvError(err instanceof Error ? err.message : t('wx.fail'));
    } finally {
      setSpaceEnvLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadWx(false);
    const id = window.setInterval(() => void loadWx(false), 60 * 1000);
    return () => window.clearInterval(id);
  }, [loadWx]);

  if (path === '/sim' || path === '/world') {
    return (
      <Suspense fallback={<div className="p-8 text-sm text-slate-500">{t('sim.loadingEngine')}</div>}>
        <SimWorldPage />
      </Suspense>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const todayRecord = dailyRecords.find((r) => r.isToday) || dailyRecords[0];

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
        onOpenAiCall={handleOpenAiCall}
        world={world}
        commanderId={myCrew?.id}
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
        onOpenAiCall={handleOpenAiCall}
        tNow={now}
      />
    ) : (
      <AstronautHome
        astronaut={selectedAstronaut}
        todayRecord={todayRecord}
        selfCheck={selfChecks[selectedAstronaut.id] ?? null}
        onSaveSelfCheck={(entry) => {
          setSelfChecks((prev) => ({ ...prev, [selectedAstronaut.id]: entry }));
          showToast(t('astro.selfCheckSaved'));
        }}
        tasks={stationTasks}
        onToggleActivity={handleToggleActivity}
        onToggleTaskStatus={handleToggleTaskStatus}
        onOpenAiCall={handleOpenAiCall}
        onOpenConsole={() => setView('console')}
        spaceEnvironment={displayWx}
        speDemo={speDemo}
        world={world}
      />
    );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <a
        href="#main-records"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:px-3 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow"
      >
        {t('nav.skipToRecords')}
      </a>
      <TopNav
        envMetrics={envMetrics}
        onOpenAiCall={() => handleOpenAiCall()}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleLogin}
        isRightPanelCollapsed={isRightPanelCollapsed}
        onToggleRightPanel={() => setIsRightPanelCollapsed((prev) => !prev)}
        view={view}
        onChangeView={setView}
        speDemo={speDemo}
        onToggleSpeDemo={() => setSpeDemo((v) => !v)}
      />

      {view === 'hq' && <HqConsole world={world} now={now} wx={displayWx} onOpenAiCall={handleOpenAiCall} />}
      {view === 'home' && roleHome}
      {view === 'sources' && (
        <DataSourcesPage onBack={() => setView(currentUser.role === 'NASA' ? 'hq' : 'home')} wx={displayWx} />
      )}
      {view === 'console' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <aside className="w-full lg:w-[21rem] xl:w-[22.5rem] shrink-0 flex flex-col overflow-y-auto">
            <AstronautSidebar
              currentAstronaut={selectedAstronaut}
              allAstronauts={astronauts}
              onSelectAstronaut={handleSelectAstronaut}
              envMetrics={envMetrics}
              onUpdateEnvMetrics={() => undefined}
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
            selectedDate={selectedDate || world.taipeiIsoDate}
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

      {todayRecord && (
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
      )}

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onAddTask={handleAddTask}
        astronauts={astronauts}
      />

      <AddActivityModal
        isOpen={activityModalDate !== null}
        onClose={() => setActivityModalDate(null)}
        date={activityModalDate || world.taipeiIsoDate}
        onAddActivity={handleAddActivity}
      />

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-[var(--sm-shadow)] text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
