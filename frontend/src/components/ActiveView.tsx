import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LuRadio, LuLightbulb } from 'react-icons/lu';
import type { Hint } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
                    {hints.map((hint) => {
                        if (hint.type === 'loading') {
                            return (
                                <motion.div
                                    key={hint.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4 rounded-2xl w-fit shadow-sm flex items-center gap-3"
                                >
                                    <div className="flex gap-1">
                                        <motion.div
                                            className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.div
                                            className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                        />
                                        <motion.div
                                            className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 animate-pulse">Thinking...</span>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div
                                key={hint.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    "p-4 rounded-2xl border text-sm leading-relaxed shadow-sm",
                                    hint.type === 'user'
                                        ? "ml-auto bg-indigo-600 text-white border-transparent max-w-[85%]"
                                        : hint.type === 'info'
                                            ? "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300 max-w-[90%]"
                                            : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-gray-800 dark:text-amber-100 max-w-[90%]"
                                )}
                            >
                                {hint.type === 'warning' && (
                                    <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                                        <LuLightbulb className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">AI Insight</span>
                                    </div>
                                )}
                                <div className="markdown-content break-words">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            pre: ({ children }) => <>{children}</>,
                                            code({ node, inline, className, children, ...props }: any) {
                                                return !inline ? (
                                                    <div className="bg-black/10 dark:bg-black/30 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono">
                                                        <pre className="m-0 p-0 whitespace-pre">
                                                            <code {...props} className={className}>
                                                                {children}
                                                            </code>
                                                        </pre>
                                                    </div>
                                                ) : (
                                                    <code {...props} className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono break-all">
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>,
                                            ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>,
                                            p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
                                            a: ({ children, href }: { children?: React.ReactNode, href?: string }) => <a href={href} target="_blank" rel="noreferrer" className="underline decoration-indigo-400 underline-offset-2 hover:text-indigo-500">{children}</a>
                                        }}
                                    >
                                        {hint.text}
                                    </ReactMarkdown>
                                </div>
                                <span className="block text-right mt-1 text-[10px] opacity-40">
                                    {new Date(hint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        );
                    })}
                    <div ref={hintsEndRef} />
                </div>
            </div>
        </>
    );
};
