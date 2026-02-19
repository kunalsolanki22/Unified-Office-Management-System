
import React from 'react';
import {
    FileText,
    AlertCircle
} from 'lucide-react';
import LeaveApproval from '../../components/leave/LeaveApproval';

const Approvals = () => {
    return (
        <div className="space-y-6 animate-fade-in relative">
            <div>
                <h1 className="text-2xl font-bold text-[#1e3a8a] mb-2">
                    APPROVALS <span className="text-[#FFB012]">HUB</span>
                </h1>
                <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                    Manage Pending Requests & Allocations
                </p>
            </div>

            <div className="flex flex-col gap-8">
                {/* Leave Approval Section */}
                <LeaveApproval />
            </div>
        </div>
    );
};

export default Approvals;
