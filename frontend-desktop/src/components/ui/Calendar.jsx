import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const Calendar = ({ events = [], title = "CALENDAR" }) => {
    const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    const getEventForDate = (day) => {
        return events.find(e => {
            const eventDate = new Date(e.date);
            return eventDate.getDate() === day &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-12 sm:h-12 md:h-12 lg:h-12"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const event = getEventForDate(day);
            const today = isToday(day);

            let cellClass = 'text-[#1a367c] hover:bg-[#f8f9fa]';

            if (today && event) {
                // Today AND a holiday — blue ring with red background
                cellClass = 'bg-red-100 text-red-700 ring-2 ring-[#1a367c] ring-offset-1 shadow-md scale-110';
            } else if (today) {
                // Today only — solid blue (Google Calendar style)
                cellClass = 'bg-[#1a367c] text-white shadow-lg shadow-blue-900/30 scale-110';
            } else if (event) {
                // Holiday only — red/rose
                cellClass = 'bg-red-100 text-red-700 shadow-sm';
            }

            days.push(
                <div
                    key={day}
                    className={`h-12 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all duration-300 relative group ${cellClass}`}
                    title={event ? event.name : (today ? 'Today' : '')}
                >
                    {day}
                    {event && !today && (
                        <div className="absolute -bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    )}
                    {today && !event && (
                        <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#1a367c] rounded-full"></div>
                    )}
                </div>
            );
        }

        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3 text-lg font-bold text-[#1a367c]">
                    <CalendarDays className="w-5 h-5 text-[#f9b012]" />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="w-8 h-8 rounded-lg bg-[#f8f9fa] flex items-center justify-center hover:bg-slate-100 transition-colors text-[#333]"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="w-8 h-8 rounded-lg bg-[#f8f9fa] flex items-center justify-center hover:bg-slate-100 transition-colors text-[#333]"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4 mb-4">
                {DAYS.map(day => (
                    <div key={day} className="text-center text-[0.7rem] font-bold text-[#8892b0] tracking-wider">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
                {renderCalendarDays()}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-[#1a367c]"></div>
                    <span className="text-[0.65rem] font-bold text-[#8892b0] tracking-wide">TODAY</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-red-100 border border-red-200"></div>
                    <span className="text-[0.65rem] font-bold text-[#8892b0] tracking-wide">HOLIDAY</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
