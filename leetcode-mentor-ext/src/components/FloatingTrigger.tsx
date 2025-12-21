import { motion } from 'framer-motion';
import { LuSparkles, LuX } from 'react-icons/lu';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface FloatingTriggerProps {
    isOpen: boolean;
    toggleOpen: () => void;
}

export const FloatingTrigger = ({ isOpen, toggleOpen }: FloatingTriggerProps) => {
    return (
        <motion.button
            layout
            onClick={toggleOpen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-2 z-50",
                isOpen
                    ? "bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-800 dark:text-white rotate-90"
                    : "bg-black dark:bg-white border-transparent text-white dark:text-black hover:shadow-black/25 dark:hover:shadow-white/25"
            )}
        >
            {isOpen ? <LuX className="w-6 h-6" /> : <LuSparkles className="w-6 h-6" />}
        </motion.button>
    );
};
