import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const variants = {
        hidden: { opacity: 0, y: 50, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.9 }
    };

    const styles = {
        success: 'bg-white border-green-100 text-[#1a367c]',
        error: 'bg-white border-red-100 text-red-600',
        warning: 'bg-white border-yellow-100 text-yellow-600'
    };

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-yellow-500" />
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={variants}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${styles[type]} min-w-[300px]`}
            >
                <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-50' : type === 'error' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                    {icons[type]}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold">{message}</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Toast;
