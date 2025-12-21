import type { ReactNode } from 'react';

interface SettingCardProps {
    children: ReactNode;
    className?: string;
}

export const SettingCard = ({ children, className = '' }: SettingCardProps) => (
    <div className={`bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 space-y-3 shadow-sm ${className}`}>
        {children}
    </div>
);
