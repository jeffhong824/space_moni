import React, { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { StationTask, AstronautProfile } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey } from '../i18n/index';
import { OverlayDialog } from '../ui/chrome';

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
  const [module, setModule] = useState('mod.columbus');
  const [priority, setPriority] = useState<StationTask['priority']>('High');
  const [description, setDescription] = useState('');
  const { t, lang } = useI18n();
  const [assignedAstroName, setAssignedAstroName] = useState(astronauts[0]?.name || 'Alice Smith');

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
          role: assigned?.role || 'occ.science',
          avatarBg: 'bg-cyan-600',
        },
      ],
      deadline: 'Today, 22:00 UTC',
      description: description.trim() || t('newTask.defaultDesc'),
    };

    onAddTask(newTask);
    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <OverlayDialog
      open={isOpen}
      onClose={onClose}
      titleId="new-task-title"
      title={
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-sky-600" />
          <h3 id="new-task-title" className="text-base font-bold text-slate-900">
            {t('newTask.title')}
          </h3>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <div>
          <label className="block text-slate-700 font-semibold mb-1" htmlFor="new-task-name">
            {t('newTask.name')}
          </label>
          <input
            id="new-task-name"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('newTask.placeholder')}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1" htmlFor="new-task-module">
              {t('newTask.module')}
            </label>
            <select
              id="new-task-module"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="mod.columbus">{t('mod.columbus')}</option>
              <option value="mod.destiny">{t('mod.destiny')}</option>
              <option value="mod.kibo">{t('mod.kibo')}</option>
              <option value="mod.tranquility">{t('mod.tranquility')}</option>
              <option value="mod.exterior">{t('mod.exterior')}</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1" htmlFor="new-task-priority">
              {t('newTask.priority')}
            </label>
            <select
              id="new-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as StationTask['priority'])}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Critical">{t('priority.Critical')}</option>
              <option value="High">{t('priority.High')}</option>
              <option value="Medium">{t('priority.Medium')}</option>
              <option value="Routine">{t('priority.Routine')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1" htmlFor="new-task-assign">
            {t('newTask.assign')}
          </label>
          <select
            id="new-task-assign"
            value={assignedAstroName}
            onChange={(e) => setAssignedAstroName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {astronauts.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name} ({localizeKey(lang, a.role)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1" htmlFor="new-task-notes">
            {t('newTask.desc')}
          </label>
          <textarea
            id="new-task-notes"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('newTask.notesPlaceholder')}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
          >
            {t('newTask.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-2xs"
          >
            {t('newTask.create')}
          </button>
        </div>
      </form>
    </OverlayDialog>
  );
};
