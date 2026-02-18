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
            const isSelected = event || isToday(day);

            days.push(
                <div
                    key={day}
                    className={`h-12 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all duration-300 relative group
                        ${isSelected
                            ? 'bg-[#f9b012] text-white shadow-lg shadow-orange-500/30 scale-110'
                            : 'text-[#1a367c] hover:bg-[#f8f9fa]'
                        }`}
                    title={event ? event.name : ''}
                >
                    {day}
                    {event && (
                        <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>
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
        </div>
    );
};

export default Calendar;
