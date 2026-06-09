import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  initialDate: string; // YYYY-MM-DD
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  initialDate
}) => {
  if (!isOpen) return null;

  // Parse initialDate
  const parsedDate = new Date(initialDate);
  const initialYear = isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();
  const initialMonth = isNaN(parsedDate.getTime()) ? new Date().getMonth() : parsedDate.getMonth(); // 0-indexed
  const initialDay = isNaN(parsedDate.getTime()) ? new Date().getDate() : parsedDate.getDate();

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth); // 0 = Jan, 11 = Dec
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  // Keep state in sync when modal is opened on a new or changed date
  React.useEffect(() => {
    if (isOpen) {
      const d = new Date(initialDate);
      const y = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
      const m = isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
      const dayVal = isNaN(d.getTime()) ? new Date().getDate() : d.getDate();
      setCurrentYear(y);
      setCurrentMonth(m);
      setSelectedDay(dayVal);
    }
  }, [isOpen, initialDate]);

  // Month names in Traditional Chinese
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const startDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const totalDays = daysInMonth(currentYear, currentMonth);
  const startOffset = startDayOfWeek(currentYear, currentMonth);

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  const handleDaySelect = (day: number | null) => {
    if (day !== null) {
      setSelectedDay(day);
    }
  };

  const handleConfirm = () => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    onSelectDate(`${currentYear}-${formattedMonth}-${formattedDay}`);
    onClose();
  };

  return (
    <div id="datepicker-modal" className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop blur */}
      <div 
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[12px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 z-10 mx-auto border border-zinc-100 dark:border-zinc-800">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">選擇日期</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                type="button"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </button>
              <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                {currentYear}年 {monthNames[currentMonth]}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                type="button"
              >
                <ChevronRight className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-5">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            <div>日</div>
            <div>一</div>
            <div>二</div>
            <div>三</div>
            <div>四</div>
            <div>五</div>
            <div>六</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {daysGrid.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="py-2.5" />;
              }

              const isSelected = day === selectedDay;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDaySelect(day)}
                  className={`py-2.5 text-base rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff7f50] text-white font-bold shadow-md shadow-[#ff7f50]/20 scale-105 ring-2 ring-[#ff7f50]/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-xl text-base font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
            type="button"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-6 rounded-xl text-base font-bold bg-[#ff7f50] text-white shadow-lg shadow-[#ff7f50]/20 hover:bg-[#ff6d37] transition-all active:scale-95"
            type="button"
          >
            確認
          </button>
        </div>

      </div>
    </div>
  );
};
