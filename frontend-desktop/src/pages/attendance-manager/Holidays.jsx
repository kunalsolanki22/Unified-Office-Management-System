import { CalendarDays } from 'lucide-react';
import Calendar from '../../components/ui/Calendar';

const Holidays = () => {
    const holidays = [
        { date: 'Feb 26, 2026', name: 'Maha Shivratri' },
        { date: 'Mar 14, 2026', name: 'Holi' }
    ];

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
                <Calendar events={holidays} />

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
