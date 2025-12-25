import { SettingCard } from './SettingCard';

interface SettingInputProps {
    label: string;
    description?: string;
    value: number | string;
    type?: string;
    onChange: (value: string) => void;
    suffix?: string;
    min?: number;
    disabled?: boolean;
}

export const SettingInput = ({ label, description, value, type = 'text', onChange, suffix, min, disabled }: SettingInputProps) => (
    <SettingCard>
        <div className={disabled ? 'opacity-50' : ''}>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{label}</h3>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <input
                    type={type}
                    min={min}
                    disabled={disabled}
                    className={`w-full bg-gray-50 dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-20 py-2.5 text-gray-900 dark:text-gray-100 outline-none transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500 ${disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-500'
                        }`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                {suffix && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none select-none ${disabled ? 'opacity-50' : ''}`}>
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    </SettingCard>
);
