import { LuLightbulb, LuX } from 'react-icons/lu';
import type { Hint } from '../types';

interface LiveToastProps {
    hint: Hint;
    onClose?: () => void;
}

export const LiveToast = ({ hint, onClose }: LiveToastProps) => (
    <div className="w-[320px] bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-2xl p-4 border border-amber-200 dark:border-amber-500/30 flex items-start gap-4 cursor-pointer hover:scale-[1.02] transition-transform pointer-events-auto">
        <div className="shrink-0 p-2 bg-amber-100 dark:bg-amber-500/20 rounded-full mt-0.5">
            <LuLightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5 uppercase tracking-wide">
                New Insight
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-4 leading-snug">
                {hint.text}
            </p>
        </div>
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClose?.();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
        >
            <LuX className="w-4 h-4" />
        </button>
    </div>
);
