import { LuSquare, LuLightbulb } from 'react-icons/lu';
import { Button } from './Button';

interface ActiveFooterProps {
    onEndSession: () => void;
    onRequestHint: () => void;
}

export const ActiveFooter = ({ onEndSession, onRequestHint }: ActiveFooterProps) => {
    return (
        <div className="p-4 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-white/5">
            <Button
                onClick={onRequestHint}
                variant="secondary"
                size="md"
                fullWidth
                className="mb-2"
            >
                <LuLightbulb className="w-4 h-4" />
                Ask for Hint
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
