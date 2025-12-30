import { SettingCard } from './SettingCard';

interface Option {
    label: string;
    value: string;
}

interface SettingSelectProps {
    label: string;
    description?: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const SettingSelect = ({ label, description, value, options, onChange, disabled }: SettingSelectProps) => (
    <SettingCard>
        <div className={disabled ? 'opacity-50' : ''}>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{label}</h3>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <select
                    disabled={disabled}
                    style={{
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                    }}
                    className={`w-full bg-gray-50 dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-gray-900 dark:text-gray-100 outline-none transition-all font-medium appearance-none ${disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-500 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    </SettingCard>
);
