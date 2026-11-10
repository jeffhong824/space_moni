import React, { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';
import { DailyActivityItem } from '../types';
import { useI18n } from '../i18n/I18nProvider';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onAddActivity: (date: string, item: DailyActivityItem) => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  date,
  onAddActivity,
}) => {
  const [title, setTitle] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const { t } = useI18n();
  const [category, setCategory] = useState<DailyActivityItem['category']>('Research');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: DailyActivityItem = {
      id: 'act-' + Date.now(),
      title: title.trim(),
      completed: false,
      timeSlot: timeSlot.trim() || undefined,
      category,
    };

    onAddActivity(date, newItem);
    onClose();
    setTitle('');
    setTimeSlot('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">
              {t('addAct.title')} · {date}
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
              {t('addAct.name')}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Microgravity seed hydration check"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t('addAct.slot')}
            </label>
            <input
              type="text"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              placeholder="e.g. 14:00 - 15:30"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t('addAct.category')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Research">{t('cat.Research')}</option>
              <option value="Maintenance">{t('cat.Maintenance')}</option>
              <option value="Health Countermeasure">{t('cat.Health Countermeasure')}</option>
              <option value="Operation">{t('cat.Operation')}</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              {t('common.close')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-2xs"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
