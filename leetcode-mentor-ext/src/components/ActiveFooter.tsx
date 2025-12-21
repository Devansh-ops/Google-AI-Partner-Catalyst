import { LuSquare, LuLightbulb, LuMessageSquare } from 'react-icons/lu';
import { Button } from './Button';

interface ActiveFooterProps {
    onEndSession: () => void;
    onRequestHint: () => void;
    canEnterChat: boolean;
    onEnterChat: () => void;
    isHintThrottled?: boolean;
}

export const ActiveFooter = ({ onEndSession, onRequestHint, canEnterChat, onEnterChat, isHintThrottled = false }: ActiveFooterProps) => {
    return (
        <div className="p-4 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-white/5">
            {canEnterChat && (
                <Button
                    onClick={onEnterChat}
                    variant="primary"
                    size="md"
                    fullWidth
                    className="mb-2"
                >
                    <LuMessageSquare className="w-4 h-4" />
                    Enter Chat Mode
                </Button>
            )}
            <Button
                onClick={onRequestHint}
                variant="secondary"
                size="md"
                fullWidth
                className="mb-2"
                disabled={isHintThrottled}
            >
                <LuLightbulb className="w-4 h-4" />
                {isHintThrottled ? "Wait 1m" : "Ask for Hint"}
            </Button>
            <Button
                onClick={onEndSession}
                variant="danger"
                size="md"
                fullWidth
            >
                <LuSquare className="w-4 h-4" />
                End Session
            </Button>
        </div>
    );
};
