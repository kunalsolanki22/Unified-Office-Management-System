import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const Holidays = () => {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900"><span className="text-blue-900">Holiday</span> <span className="text-orange-500">Registry</span></h1>
                <p className="text-slate-500 text-sm uppercase tracking-wider">Manage global off-days for the administrative force</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Section */}
                <div className="lg:col-span-2">
                    <Card className="p-8 border-none shadow-sm rounded-3xl min-h-[500px]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2 text-blue-900 font-bold text-xl">
                                <CalendarIcon className="h-6 w-6 text-orange-500" />
                                February 2026
                            </div>
                            <div className="flex gap-2">
                                <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600">
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600">
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-4 text-center mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-xs font-bold text-slate-300 uppercase tracking-wider">{day}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-4 text-center">
                            {/* Empty cells for start of month (Feb 2026 starts on Sunday) */}

                            {/* Days 1-28 */}
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
                                const isSelected = day === 26;
                                return (
                                    <div
                                        key={day}
                                        className={`
                                        h-10 w-10 mx-auto flex items-center justify-center rounded-xl text-sm font-medium transition-all cursor-pointer
                                        ${isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110' : 'text-blue-900 hover:bg-slate-50'}
                                    `}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-12 h-1 w-12 mx-auto bg-orange-500 rounded-full"></div>
                    </Card>

                    <div className="mt-8">
                        <h3 className="text-blue-900 font-bold text-lg mb-4">Scheduled Observances</h3>
                    </div>
                </div>

                {/* Proclaim Holiday Form */}
                <div>
                    <Card className="p-8 border-none shadow-sm rounded-3xl h-full flex flex-col">
                        <h3 className="text-blue-900 font-bold text-lg mb-8 uppercase tracking-wide">Proclaim Holiday</h3>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Event Name</label>
                                <div className="bg-slate-50 rounded-xl px-4 py-3 text-slate-500 text-sm">
                                    e.g. Maha Shivratri
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Execution Date</label>
                                <div className="bg-slate-50 rounded-xl px-4 py-3 text-slate-900 font-medium text-sm flex items-center justify-between">
                                    dd / mm / yyyy
                                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white rounded-xl py-6 shadow-xl shadow-blue-900/20 mt-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Commit to Registry
                        </Button>
                        <div className="h-1 w-12 mx-auto bg-orange-500 rounded-full mt-6"></div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
export default Holidays;
