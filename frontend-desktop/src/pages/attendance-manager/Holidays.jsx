import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const Holidays = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    // Generating dummy calendar days for Feb 2026
    const calendarDays = [];
    for (let i = 0; i < 3; i++) calendarDays.push(null); // Empty slots
    for (let i = 1; i <= 28; i++) calendarDays.push(i);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c]">
                    ORGANIZATION <span className="text-[#f9b012]">CALENDAR</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    Manage Public Holidays & Restricted Leaves
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div className="text-[1.1rem] font-bold text-[#1a367c] flex items-center gap-2">
                            FEBRUARY 2026
                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-[#8892b0] font-semibold tracking-wide">Q1 FY26</span>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#1a367c] hover:bg-[#1a367c] hover:text-white transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#1a367c] hover:bg-[#1a367c] hover:text-white transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 text-center">
                        {days.map(day => (
                            <div key={day} className="text-xs font-bold text-[#8892b0] mb-4">{day}</div>
                        ))}
                        {calendarDays.map((date, index) => (
                            <div
                                key={index}
                                className={`h-[50px] flex items-center justify-center text-sm font-semibold rounded-lg mb-2 transition-all cursor-pointer
                                    ${!date ? '' :
                                        date === 10 || date === 26
                                            ? 'bg-[#f9b012] text-white shadow-lg shadow-orange-200 scale-105'
                                            : 'text-[#1a367c] hover:bg-slate-50'
                                    }`}
                            >
                                {date}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 h-fit">
                    <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-6">
                        <CalendarDays className="w-4 h-4 text-[#f9b012]" />
                        UPCOMING HOLIDAYS
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 pb-4 border-b border-slate-100">
                            <div className="text-xs font-bold text-[#f9b012] min-w-[50px] pt-1">FEB 26</div>
                            <div className="flex-1">
                                <div className="font-bold text-[#1a367c] text-sm mb-1">Maha Shivratri</div>
                                <div className="text-xs text-[#8892b0]">Public Holiday</div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-xs font-bold text-[#f9b012] min-w-[50px] pt-1">MAR 14</div>
                            <div className="flex-1">
                                <div className="font-bold text-[#1a367c] text-sm mb-1">Holi</div>
                                <div className="text-xs text-[#8892b0]">Festival of Colors</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Holidays;
