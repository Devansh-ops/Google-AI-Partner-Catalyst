import { LuArrowLeft } from 'react-icons/lu';
import { Button } from '../Button';

interface SettingsHeaderProps {
    onBack: () => void;
    title: string;
}

export const SettingsHeader = ({ onBack, title }: SettingsHeaderProps) => (
    <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-white dark:bg-[#1a1a1a]">
        <Button variant="ghost" size="icon" onClick={onBack}>
            <LuArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
    </div>
);
