import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';

const SeatingReservations = ({ reservations }) => {
    return (
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold text-[#1a367c]">Seating Reservations</div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-100">
                        <TableHead className="w-[80px] text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest pl-4">ID</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Employee</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Seat</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest text-right pr-4">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reservations.map((res) => (
                        <TableRow key={res.id} className="hover:bg-[#fafbfb] border-b border-slate-50 last:border-0 transition-colors">
                            <TableCell className="text-[#8892b0] text-[0.7rem] font-medium pl-4 py-3">#{res.id}</TableCell>
                            <TableCell className="text-sm font-medium text-[#333] py-3">{res.emp}</TableCell>
                            <TableCell className="font-bold text-[#1a367c] text-sm py-3">{res.seat}</TableCell>
                            <TableCell className="text-sm text-slate-500 text-right pr-4 py-3">{res.time}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default SeatingReservations;
