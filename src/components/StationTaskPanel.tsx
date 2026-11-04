import React, { useState } from 'react';
import { CheckSquare, Filter, Plus, Clock, Users, ArrowUpRight, CheckCircle2, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { StationTask } from '../types';

interface StationTaskPanelProps {
  tasks: StationTask[];
  onToggleTaskStatus: (taskId: string) => void;
  onUpdateTaskProgress: (taskId: string, newProgress: number) => void;
  onOpenNewTaskModal: () => void;
}

export const StationTaskPanel: React.FC<StationTaskPanelProps> = ({
  tasks,
  onToggleTaskStatus,
  onUpdateTaskProgress,
  onOpenNewTaskModal,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
    if (searchQuery.trim() && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.module.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getPriorityStyle = (priority: StationTask['priority']) => {
    switch (priority) {
      case 'Critical':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'High':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Medium':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col h-full bg-slate-100/60 border-l border-slate-200/80 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 lg:p-5 bg-white border-b border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Space Station Objectives
              </h2>
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              Station-wide mission-critical operations & experiments
            </p>
          </div>
          <button
            onClick={onOpenNewTaskModal}
            className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors flex items-center gap-1 text-xs px-2.5 font-medium"
            title="Create new station task"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>

        {/* Priority Filter segmented tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          {(['ALL', 'Critical', 'High', 'Medium', 'Routine'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`flex-1 py-1 text-[11px] rounded-md transition-colors ${
                priorityFilter === p ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>
          <span className="text-[11px] font-mono tabular-nums">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-200">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No station objectives match filters</p>
            <button
              onClick={() => {
                setPriorityFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-2 text-xs text-sky-600 hover:underline font-mono"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'Completed';

            return (
              <div
                key={task.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
              >
                {/* Header: Module & Priority */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-mono font-medium text-slate-500">
                    {task.module}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase font-mono ${getPriorityStyle(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>

                {/* Task Title */}
                <h3
                  className={`text-xs font-bold leading-snug ${
                    isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </h3>

                {/* Description */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>

                {/* Progress Bar & Status Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-slate-500">Progress:</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                {/* Crew Members & Actions footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Crew avatars */}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {task.assignedCrew.map((c, i) => (
                        <div
                          key={i}
                          className={`inline-block h-5 w-5 rounded-full ring-2 ring-white text-[9px] font-bold text-white flex items-center justify-center ${c.avatarBg}`}
                          title={`${c.name} (${c.role})`}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-600 truncate max-w-[90px]">
                      {task.assignedCrew.map((c) => c.name.split(' ')[0]).join(', ')}
                    </span>
                  </div>

                  {/* Complete toggle & Quick Progress */}
                  <div className="flex items-center gap-1">
                    {!isCompleted && (
                      <button
                        onClick={() => onUpdateTaskProgress(task.id, Math.min(100, task.progress + 15))}
                        className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                        title="Add 15% progress"
                      >
                        +15%
                      </button>
                    )}
                    <button
                      onClick={() => onToggleTaskStatus(task.id)}
                      className={`p-1 rounded transition-colors ${
                        isCompleted
                          ? 'text-emerald-600 hover:text-emerald-700'
                          : 'text-slate-400 hover:text-emerald-600'
                      }`}
                      title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
