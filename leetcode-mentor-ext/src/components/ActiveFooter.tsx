import { LuSquare, LuLightbulb } from 'react-icons/lu';

interface ActiveFooterProps {
    onEndSession: () => void;
    onRequestHint: () => void;
}

export const ActiveFooter = ({ onEndSession, onRequestHint }: ActiveFooterProps) => {
    return (
        <div className="p-4 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-white/5">
            <button
                onClick={onRequestHint}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 mb-2"
            >
                <LuLightbulb className="w-4 h-4" />
                Ask for Hint
            </button>
            <button
                onClick={onEndSession}
                className="w-full py-3 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
                <LuSquare className="w-4 h-4" />
                End Session
            </button>
        </div>
    );
};
