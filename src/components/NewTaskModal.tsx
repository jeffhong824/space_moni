import React, { useState } from 'react';
import { X, CheckSquare, Plus } from 'lucide-react';
import { StationTask, AstronautProfile } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: StationTask) => void;
  astronauts: AstronautProfile[];
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  astronauts,
}) => {
  const [title, setTitle] = useState('');
  const [module, setModule] = useState<StationTask['module']>('Columbus BioLab');
  const [priority, setPriority] = useState<StationTask['priority']>('High');
  const [description, setDescription] = useState('');
  const [assignedAstroName, setAssignedAstroName] = useState(astronauts[0]?.name || 'Alice Smith');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assigned = astronauts.find((a) => a.name === assignedAstroName);

    const newTask: StationTask = {
      id: 'tsk-' + Date.now(),
      title: title.trim(),
      module,
      priority,
      status: 'In Progress',
      progress: 0,
      assignedCrew: [
        {
          name: assignedAstroName,
          role: assigned?.role || 'Mission Specialist',
          avatarBg: 'bg-cyan-600',
        },
      ],
      deadline: 'Today, 22:00 UTC',
      description: description.trim() || 'Mission directive logged from orbital station task console.',
    };

    onAddTask(newTask);
    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">
              新增太空站目標
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              目標／任務名稱
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Microgravity cell culture media replacement"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                站上模組
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Columbus BioLab">Columbus BioLab</option>
                <option value="Destiny Lab">Destiny Lab</option>
                <option value="Kibo Module">Kibo Module</option>
                <option value="Tranquility ECLSS">Tranquility ECLSS</option>
                <option value="Station Exterior">Station Exterior</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                優先等級
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Critical">危急</option>
                <option value="High">高</option>
                <option value="Medium">中</option>
                <option value="Routine">例行</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              指派組員
            </label>
            <select
              value={assignedAstroName}
              onChange={(e) => setAssignedAstroName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {astronauts.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              說明與程序註記
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline steps, safety parameters, or specimen tags..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-2xs"
            >
              建立目標
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
