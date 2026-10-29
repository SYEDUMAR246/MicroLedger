import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({ selectedDate, onSelectDate }) => {
  // Generate a 7-day strip centered around the selected date or current week
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Default to October 2026
  const baseDate = new Date('2026-10-28T00:00:00');
  const dates = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayNumber = d.getDate();
    // 0 is Sunday, so (day + 6) % 7 maps Monday -> 0, Sunday -> 6
    const dayIndex = (d.getDay() + 6) % 7;
    dates.push({
      iso,
      dayNumber,
      dayLabel: daysOfWeek[dayIndex],
    });
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-xs font-bold text-slate-800 tracking-wide">October 2026</div>
        <button
          type="button"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {dates.map((item) => {
          const isSelected = item.iso === selectedDate;
          return (
            <button
              key={item.iso}
              type="button"
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
