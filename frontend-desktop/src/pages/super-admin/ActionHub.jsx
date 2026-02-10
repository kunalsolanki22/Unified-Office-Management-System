import { Car, Utensils, Monitor, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { HoverEffectCard } from '../../components/ui/Card';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
};

const ActionHub = () => {
    const actions = [
        {
            title: 'Parking Manager',
            subtitle: 'Slot & Capacity Controls',
            icon: Car,
            color: 'slate'
        },
        {
            title: 'Cafeteria Ops',
            subtitle: 'Food & Desk Oversight',
            icon: Utensils,
            color: 'slate'
        },
        {
            title: 'Hardware Registry',
            subtitle: 'Inventory Assignment',
            icon: Monitor,
            color: 'slate'
        },
        {
            title: 'Attendance Hub',
            subtitle: 'Workforce Adjudication',
            icon: Clock,
            color: 'slate'
        },
    ];

    return (
        <motion.div
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {actions.map((action, index) => (
                    <motion.div key={index} variants={item}>
                        <HoverEffectCard className="p-8 flex flex-col items-start justify-between min-h-[220px] rounded-3xl border-none shadow-sm">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-900 mb-6">
                                <action.icon className="h-6 w-6" />
                            </div>

                            <div className="mt-auto">
                                <h3 className="text-lg font-bold text-blue-900 leading-tight mb-1">{action.title}</h3>
                                <p className="text-xs text-slate-400 font-medium">{action.subtitle}</p>
                            </div>

                            <div className="w-12 h-1 bg-orange-500 rounded-full mt-6"></div>
                        </HoverEffectCard>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
export default ActionHub;
