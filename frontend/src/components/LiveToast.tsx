import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LuLightbulb, LuX, LuInfo } from 'react-icons/lu';

interface LiveToastProps {
    title?: string;
    message: string;
    type?: 'insight' | 'info';
    onClose?: () => void;
}

export const LiveToast = ({ title, message, type = 'insight', onClose }: LiveToastProps) => {
    const isInsight = type === 'insight';

    // Color configurations
    const borderColor = isInsight
        ? "border-amber-200 dark:border-amber-500/30"
        : "border-blue-500/30";

    const iconBg = isInsight
        ? "bg-amber-100 dark:bg-amber-500/20"
        : "bg-blue-500/20";

    const iconColor = isInsight
        ? "text-amber-600 dark:text-amber-400"
        : "text-blue-500";

    const titleColor = isInsight
        ? "text-amber-600 dark:text-amber-400"
        : "text-blue-400";

    return (
        <div className={`w-[320px] bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-2xl p-4 border ${borderColor} flex items-start gap-4 cursor-pointer hover:scale-[1.02] transition-transform pointer-events-auto`}>
            <div className={`shrink-0 p-2 rounded-full mt-0.5 ${iconBg}`}>
                {isInsight ? (
                    <LuLightbulb className={`w-5 h-5 ${iconColor}`} />
                ) : (
                    <LuInfo className={`w-5 h-5 ${iconColor}`} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${titleColor} mb-0.5 uppercase tracking-wide`}>
                    {title || (isInsight ? "New Insight" : "System Update")}
                </p>
                <div className="text-sm text-gray-700 dark:text-gray-200 line-clamp-4 leading-snug prose dark:prose-invert prose-sm max-w-none prose-p:my-0 prose-ul:my-0 prose-li:my-0">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ children }: { children?: React.ReactNode }) => <span className="block mb-1 last:mb-0">{children}</span>,
                            a: ({ children }: { children?: React.ReactNode }) => <span className="text-indigo-500 underline">{children}</span>,
                            code: ({ children }: { children?: React.ReactNode }) => <code className="bg-black/10 dark:bg-white/10 px-1 rounded text-xs font-mono">{children}</code>
                        }}
                    >
                        {message}
                    </ReactMarkdown>
                </div>
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
};
