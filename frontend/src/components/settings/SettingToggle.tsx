import { SettingCard } from './SettingCard';

interface SettingToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export const SettingToggle = ({ label, description, checked, onChange, disabled }: SettingToggleProps) => (
    <SettingCard>
        <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex-1 pr-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{label}</h3>
                {description && <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{description}</p>}
            </div>
            <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 dark:peer-focus:ring-indigo-500/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600 transition-colors"></div>
            </label>
        </div>
    </SettingCard>
);
