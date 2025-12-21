import { LuX } from 'react-icons/lu';
import type { SessionState } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface HeaderProps {
    sessionState: SessionState;
    onClose: () => void;
}

export const Header = ({ sessionState, onClose }: HeaderProps) => {
    return (
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md sticky top-0 z-10 transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors duration-500",
                    sessionState === 'active' ? "bg-green-500 animate-pulse" :
                        sessionState === 'starting' ? "bg-yellow-500 animate-ping" : "bg-gray-400"
                )} />
                <h2 className="font-semibold text-gray-800 dark:text-white text-lg tracking-tight">
                    {sessionState === 'active' ? 'Live Session' : 'Focus Mentor'}
                </h2>
            </div>
            <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 transition-colors"
            >
                <LuX className="w-5 h-5" />
            </button>
        </div>
    );
};
