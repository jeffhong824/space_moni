import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { DailyActivityItem } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { OverlayDialog } from '../ui/chrome';

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
    <OverlayDialog
      open={isOpen}
      onClose={onClose}
      titleId="add-act-title"
      title={
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" />
          <h3 id="add-act-title" className="text-base font-bold text-slate-900">
            {t('addAct.title')} · {date}
          </h3>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <div>
          <label className="block text-slate-700 font-semibold mb-1" htmlFor="add-act-name">
            {t('addAct.name')}
          </label>
          <input
            id="add-act-name"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('addAct.namePh')}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1" htmlFor="add-act-slot">
            {t('addAct.slot')}
          </label>
          <input
            id="add-act-slot"
            type="text"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            placeholder={t('addAct.slotPh')}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1" htmlFor="add-act-cat">
            {t('addAct.category')}
          </label>
          <select
            id="add-act-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as DailyActivityItem['category'])}
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
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-2xs"
          >
            {t('common.save')}
          </button>
        </div>
      </form>
    </OverlayDialog>
  );
};
