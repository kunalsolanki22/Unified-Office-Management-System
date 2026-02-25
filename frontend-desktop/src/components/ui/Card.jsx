import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Card = ({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const HoverEffectCard = ({ children, className, containerClassName }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={cn(
                "group relative border border-slate-200 bg-white overflow-hidden rounded-xl",
                containerClassName
            )}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(59, 130, 246, 0.15),
              transparent 80%
            )
          `,
                }}
            />
            <div className={cn("relative h-full", className)}>{children}</div>
        </div>
    );
};
