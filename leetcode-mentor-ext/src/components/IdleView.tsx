import { motion } from 'framer-motion';
import { LuSparkles, LuPlay } from 'react-icons/lu';

interface IdleViewProps {
    question: string;
    onStartSession: () => void;
}

export const IdleView = ({ question, onStartSession }: IdleViewProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full justify-center items-center gap-6"
        >
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20">
                <LuSparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Active Problem</h3>
                <div className="px-4">
                    {question ? (
                        <p className="text-base font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-white/5 py-2 px-4 rounded-lg border border-gray-100 dark:border-white/10">
                            {question}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Detecting problem from page...
                        </p>
                    )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">
                    Ready to start mentoring session?
                </p>
            </div>

            <div className="w-full space-y-3 px-2">
                <button
                    onClick={onStartSession}
                    disabled={!question}
                    className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                    <LuPlay className="w-4 h-4" />
                    {question ? 'Start Session' : 'Waiting for Problem...'}
                </button>
            </div>
        </motion.div>
    );
};
