import React from 'react';
import { Construction } from 'lucide-react';

const PlaceholderPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-[#8892b0] animate-fade-in">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Construction className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#1e3a8a] mb-2">Module Under Construction</h2>
            <p className="text-sm">This feature is currently being implemented.</p>
        </div>
    );
};

export default PlaceholderPage;
