import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Coffee, Monitor, Users, HardDrive, ArrowRight } from 'lucide-react';

const ActionHub = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = '/' + location.pathname.split('/')[1];



    const actions = [
        { icon: Coffee, label: 'CAFETERIA OPS', sub: 'Food Provisioning Oversight', path: `${basePath}/service-booking` },
        { icon: Monitor, label: 'DESK MANAGEMENT', sub: 'Workspace Allocation', path: `${basePath}/service-booking?tab=desk` },
        { icon: Car, label: 'PARKING MANAGER', sub: 'Slot & Capacity Controls', path: `${basePath}/service-booking?tab=parking` },
        { icon: Users, label: 'CONFERENCE MGMT', sub: 'Room Booking & Scheduling', path: `${basePath}/service-booking?tab=conference` },
        { icon: HardDrive, label: 'HARDWARE REGISTRY', sub: 'Inventory Assignment', path: `${basePath}/service-booking?tab=hardware` },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-sm font-bold text-[#1a367c] tracking-widest">SERVICES</h1>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
                {actions.map((action, idx) => (
                    <div
                        key={idx}
                        onClick={() => action.path ? navigate(action.path) : null}
                        className={`w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ${action.path ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-[#1a367c] group-hover:bg-[#1a367c] group-hover:text-white transition-colors duration-300">
                            <action.icon className="w-7 h-7" strokeWidth={1.5} />
                        </div>

                        <h3 className="text-sm font-bold text-[#1a367c] tracking-wide mb-2 group-hover:text-[#1a367c] transition-colors">
                            {action.label.split(' ').map((line, i) => (
                                <span key={i} className="block">{line}</span>
                            ))}
                        </h3>
                        <div className="text-xs text-[#8892b0] leading-relaxed mb-6 px-4">{action.sub}</div>

                        <div className="mt-auto opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <span className="text-xs font-bold text-[#f9b012] flex items-center gap-1">
                                LAUNCH <ArrowRight className="w-3 h-3" />
                            </span>
                        </div>

                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#f9b012] rounded-t-lg transition-all duration-300 group-hover:w-full group-hover:rounded-none"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActionHub;
