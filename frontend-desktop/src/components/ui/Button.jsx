import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg border-transparent',
        secondary: 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg border-transparent',
        outline: 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:text-slate-900',
        ghost: 'hover:bg-slate-100 hover:text-slate-900 text-slate-600',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10 p-0 flex items-center justify-center',
    };

    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 border",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
