import { LuX } from 'react-icons/lu';
import type { SessionState } from '../types';
import { cn } from '../utils';
import { Button } from './Button';

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
            <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="rounded-full"
            >
                <LuX className="w-5 h-5" />
            </Button>
        </div>
    );
};
