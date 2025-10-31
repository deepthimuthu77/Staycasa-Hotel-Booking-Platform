import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';

// --- TYPE DEFINITIONS ---
// Defined here for standalone use
export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type DateRangePickerProps = {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
};

// --- DateRangePicker Component ---
/**
 * A component for selecting a check-in and check-out date range.
 */
export const DateRangePicker = ({ range, onRangeChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDayClick = (day: Date) => {
    let newRange: DateRange;
    if (range.from && !range.to && day > range.from) {
      // Selecting 'to' date
      newRange = { from: range.from, to: day };
      setIsOpen(false); // Close picker after selecting range
    } else {
      // Selecting 'from' date or starting over
      newRange = { from: day, to: undefined };
    }
    onRangeChange(newRange);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRangeChange({ from: undefined, to: undefined });
  };

  const footer = range.from ? (
    <p className="p-2 text-sm text-gray-600">
      {range.to ? (
        <>
          Selected: {format(range.from, 'LLL dd, y')} &ndash; {format(range.to, 'LLL dd, y')}
        </>
      ) : (
        <>
          Please select the check-out date.
        </>
      )}
    </p>
  ) : (
    <p className="p-2 text-sm text-gray-600">Please select the check-in date.</p>
  );

  return (
    <div className="relative w-full max-w-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm text-left"
      >
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-500" />
          <div>
            <span className="text-xs font-semibold text-gray-500">CHECK-IN / CHECK-OUT</span>
            <div className="text-sm font-medium text-gray-800">
              {range.from ? format(range.from, 'dd LLL') : 'Select date'}
              {' – '}
              {range.to ? format(range.to, 'dd LLL') : 'Select date'}
            </div>
          </div>
        </div>
        {range.from && (
          <X 
            size={16} 
            className="text-gray-400 hover:text-gray-600" 
            onClick={handleReset} 
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-20 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl">
          <DayPicker
            mode="range"
            selected={range}
            onDayClick={handleDayClick}
            footer={footer}
            numberOfMonths={1}
            disabled={{ before: new Date() }}
            modifiersClassNames={{
              selected: 'bg-blue-600 text-white hover:bg-blue-700',
              today: 'font-bold text-blue-600',
            }}
            styles={{
              day: { 
                borderRadius: '9999px',
                transition: 'all 0.2s',
              },
            }}
          />
        </div>
      )}
    </div>
  );
};
