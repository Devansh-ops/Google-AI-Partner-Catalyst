import { motion } from 'framer-motion';
import { LuSave } from 'react-icons/lu';
import { Button } from './Button';
import type { Settings } from '../types';
import { useState } from 'react';
import { SettingsHeader } from './settings/SettingsHeader';
import { SettingToggle } from './settings/SettingToggle';
import { SettingInput } from './settings/SettingInput';

interface SettingsViewProps {
    settings: Settings;
    onSave: (settings: Settings) => void;
    onBack: () => void;
    readOnly?: boolean;
}


export const SettingsView = ({ settings: initialSettings, onSave, onBack, readOnly = false }: SettingsViewProps) => {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        if (readOnly) return;
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        if (readOnly) return;
        onSave(settings);
        setHasChanges(false);
        onBack();
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a]"
        >
            <SettingsHeader onBack={onBack} title="Settings" />

            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                {readOnly && (
                    <div className="bg-amber-50 p-5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-lg text-sm border border-amber-200 dark:border-amber-500/20">
                        Settings are locked during an active session
                    </div>
                )}

                <SettingToggle
                    label="Enable Chat Mode"
                    description="Allow entering interactive chat after distinct hints"
                    checked={settings.chatModeEnabled}
                    onChange={(checked) => handleChange('chatModeEnabled', checked)}
                    disabled={readOnly}
                />

                <SettingInput
                    label="Hint Throttle Duration"
                    description="Wait time between requesting hints"
                    value={settings.throttleDuration / 1000}
                    type="number"
                    min={0}
                    suffix="seconds"
                    onChange={(value) => handleChange('throttleDuration', Math.max(0, parseInt(value) || 0) * 1000)}
                    disabled={readOnly}
                />
            </div>

            {!readOnly && (
                <div className="p-5 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-white/5">
                    <Button
                        onClick={handleSave}
                        fullWidth
                        variant="primary"
                        disabled={!hasChanges}
                    >
                        <LuSave className="w-4 h-4" />
                        Save Changes
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

