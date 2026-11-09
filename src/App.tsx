import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { AstronautSidebar } from './components/AstronautSidebar';
import { DailyRecordsPanel } from './components/DailyRecordsPanel';
import { StationTaskPanel } from './components/StationTaskPanel';
import { AiCallModal } from './components/AiCallModal';
import { NewTaskModal } from './components/NewTaskModal';
import { AddActivityModal } from './components/AddActivityModal';
import { LoginPage } from './components/LoginPage';
import { SpaceEnvironmentPanel } from './components/SpaceEnvironmentPanel';
import {
  INITIAL_ASTRONAUTS,
  INITIAL_ENVIRONMENT,
  INITIAL_DAILY_RECORDS,
  INITIAL_STATION_TASKS,
  getAstronautDailyRecords,
} from './data/mockData';
import { AstronautProfile, EnvironmentalMetrics, DailyHealthRecord, StationTask, DailyActivityItem, AuthUser } from './types';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Login State - Default to null so Log-in page is displayed first by default
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Astronauts Roster
  const [astronauts] = useState<AstronautProfile[]>(INITIAL_ASTRONAUTS);
  const [selectedAstronaut, setSelectedAstronaut] = useState<AstronautProfile>(INITIAL_ASTRONAUTS[0]);

  const [envMetrics, setEnvMetrics] = useState<EnvironmentalMetrics>(() => {
    const saved = localStorage.getItem('orbital_env_metrics');
    return saved ? JSON.parse(saved) : INITIAL_ENVIRONMENT;
  });

  const [dailyRecords, setDailyRecords] = useState<DailyHealthRecord[]>(() => {
    return INITIAL_DAILY_RECORDS;
  });

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

  const handleOpenAiCall = (prompt?: string) => {
    setAiCallInitialPrompt(prompt || '');
    setIsAiCallOpen(true);
  };

  const handleSelectAstronaut = (astro: AstronautProfile) => {
    setSelectedAstronaut(astro);
    const records = getAstronautDailyRecords(astro.id);
    setDailyRecords(records);
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'Astronaut') {
      const astro = astronauts.find((a) => a.id === user.astronautId) || astronauts[0];
      handleSelectAstronaut(astro);
    } else if (user.role === 'Commander') {
      const commanderAstro = astronauts.find((a) => a.id === 'astro-marcus') || astronauts[1];
      handleSelectAstronaut(commanderAstro);
    } else {
      // NASA starts by monitoring Alice Smith
      handleSelectAstronaut(astronauts[0]);
    }
    showToast(`Logged in as ${user.name} (${user.role})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Sync state to localStorage
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

  // Activity toggles
  const handleToggleActivity = (date: string, activityId: string) => {
    setDailyRecords((prev) =>
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
    setDailyRecords((prev) =>
      prev.map((rec) => {
        if (rec.date === date) {
          return {
            ...rec,
            dailyActivities: [...rec.dailyActivities, item],
          };
        }
        return rec;
      })
    );
    showToast(`Activity added to ${date}`);
  };

  // Station Task toggles & updates
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
    showToast(`New task added: "${newTask.title}"`);
  };

  // Action execution from Call with AI
  const handleExecuteAiAction = (action: any) => {
    if (action.type === 'ADD_TASK') {
      const payload = action.payload || {};
      const newTask: StationTask = {
        id: 'tsk-' + Date.now(),
        title: payload.title || action.label,
        module: payload.module || 'Tranquility ECLSS',
        priority: payload.priority || 'High',
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
        description: payload.description || `Auto-scheduled by AURA Flight Surgeon: ${action.label}`,
      };
      setStationTasks((prev) => [newTask, ...prev]);
      showToast(`AURA scheduled task: "${newTask.title}"`);
    } else if (action.type === 'LOG_ANOMALY') {
      const note = action.payload?.note || action.label;
      setDailyRecords((prev) =>
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
      showToast(`Clinical anomaly logged to today's medical record`);
    }
  };

  // If user is not logged in, show Log-in page by default (as requested)
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const todayRecord =
    dailyRecords.find((r) => r.isToday || r.date === '2026/11/22') || dailyRecords[0];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans select-none">
      {/* Top Telemetry Header */}
      <TopNav
        envMetrics={envMetrics}
        onOpenAiCall={() => handleOpenAiCall()}
        currentUser={currentUser}
        onLogout={handleLogout}
        isRightPanelCollapsed={isRightPanelCollapsed}
        onToggleRightPanel={() => setIsRightPanelCollapsed((prev) => !prev)}
      />

      {/* Main 3-Column Responsive Workstation Layout (Matching wireframe) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar: Astronaut Personal Info & Env Metrics (Different for Commander/NASA) */}
        <div className="flex flex-col w-full lg:w-80 shrink-0 overflow-y-auto bg-slate-50 border-r border-slate-200">
          <AstronautSidebar
            currentAstronaut={selectedAstronaut}
            allAstronauts={astronauts}
            onSelectAstronaut={handleSelectAstronaut}
            envMetrics={envMetrics}
            onUpdateEnvMetrics={(updated) => setEnvMetrics((prev) => ({ ...prev, ...updated }))}
            currentUserRole={currentUser.role}
          />
          
          {/* NASA Space Environment Panel */}
          <div className="p-4 border-t border-slate-200">
            <SpaceEnvironmentPanel />
          </div>
        </div>

        {/* Center Panel: 24-Hour Daily Records & Activities + Call with AI button */}
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

        {/* Right Panel: Whole Space Station Task Objectives */}
        <StationTaskPanel
          tasks={stationTasks}
          onToggleTaskStatus={handleToggleTaskStatus}
          onUpdateTaskProgress={handleUpdateTaskProgress}
          onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
          isCollapsed={isRightPanelCollapsed}
          onToggleCollapse={() => setIsRightPanelCollapsed((prev) => !prev)}
        />
      </div>

      {/* Voice-Enabled Call with AI Modal */}
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
      />

      {/* New Station Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onAddTask={handleAddTask}
        astronauts={astronauts}
      />

      {/* Add Daily Activity Modal */}
      <AddActivityModal
        isOpen={activityModalDate !== null}
        onClose={() => setActivityModalDate(null)}
        date={activityModalDate || '2026/11/22'}
        onAddActivity={handleAddActivity}
      />

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-medium animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
