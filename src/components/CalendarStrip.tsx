import React from 'react';
import { localDate } from '../lib/finance';

interface CalendarStripProps {
  month: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({ month, selectedDate, onSelectDate }) => {
  const firstDay = new Date(month + '-01T12:00:00');
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(index + 1);
    return { iso: localDate(date), dayNumber: index + 1, dayLabel: date.toLocaleDateString('en-PK', { weekday: 'narrow' }) };
  });
  const offset = (firstDay.getDay() + 6) % 7;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-xs font-bold text-slate-800 tracking-wide">
          {firstDay.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {Array.from({ length: offset }, (_, index) => <span key={"blank-" + index} />)}
        {dates.map((item) => {
          const isSelected = item.iso === selectedDate;
          return (
            <button
              key={item.iso}
              type="button"
              aria-label={item.iso}
              aria-pressed={isSelected}
              onClick={() => onSelectDate(isSelected ? '' : item.iso)}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/25 scale-105'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`text-[10px] uppercase ${isSelected ? 'text-orange-100 font-semibold' : 'text-slate-400'}`}>
                {item.dayLabel}
              </span>
              <span className="text-sm font-bold mt-0.5">{item.dayNumber}</span>
              <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
