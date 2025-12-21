import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LuRadio, LuLightbulb } from 'react-icons/lu';
import type { Hint } from '../types';
import { cn } from '../utils';

interface ActiveViewProps {
    question: string;
    hints: Hint[];
}

export const ActiveView = ({ question, hints }: ActiveViewProps) => {
    const hintsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of hints
    useEffect(() => {
        hintsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [hints]);

    return (
        <>
            <div className="flex flex-col gap-4 min-h-full">
                <div className="full-w rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 mb-2">
                    <div className="flex items-start gap-3">
                        <LuRadio className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider mb-1">
                                Live Monitoring
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                                {question}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    {hints.map((hint) => (
                        <motion.div
                            key={hint.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                                "p-4 rounded-2xl border text-sm leading-relaxed shadow-sm",
                                hint.type === 'user'
                                    ? "ml-auto bg-indigo-600 text-white border-transparent"
                                    : hint.type === 'info'
                                        ? "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300"
                                        : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-gray-800 dark:text-amber-100"
                            )}
                        >
                            {hint.type === 'warning' && (
                                <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                                    <LuLightbulb className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">AI Insight</span>
                                </div>
                            )}
                            {hint.text}
                            <span className="block text-right mt-2 text-[10px] opacity-40">
                                {new Date(hint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </motion.div>
                    ))}
                    <div ref={hintsEndRef} />
                </div>
            </div>
        </>
    );
};
