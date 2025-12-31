import { useState } from 'react';
import { LuSend, LuArrowLeft } from 'react-icons/lu';
import { Button } from './Button';

interface ChatFooterProps {
    onSendMessage: (message: string) => void;
    onBack: () => void;
}

export const ChatFooter = ({ onSendMessage, onBack }: ChatFooterProps) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <div className="p-5 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-white/5">
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-2"
            >
                {/* Back Button */}
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    className="w-10 h-10 p-0 rounded-lg shrink-0"
                    title="Back"
                >
                    <LuArrowLeft className="w-5 h-5" />
                </Button>

                {/* Input */}
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent px-2 text-sm focus:outline-none focus:ring-0 dark:text-gray-200"
                    autoFocus
                />

                {/* Send Button */}
                <Button
                    type="submit"
                    disabled={!message.trim()}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 p-0 rounded-lg shrink-0"
                >
                    <LuSend className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
};
