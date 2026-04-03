'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarToolbarProps {
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday?: () => void;
}

export default function CalendarToolbar({
  month,
  year,
  onPrevMonth,
  onNextMonth,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-800 bg-gray-900 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onPrevMonth}
          className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl transition-all"
          title="Previous month"
        >
          <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">
          {new Date(year, month - 1).toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <button
          onClick={onNextMonth}
          className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl transition-all"
          title="Next month"
        >
          <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
