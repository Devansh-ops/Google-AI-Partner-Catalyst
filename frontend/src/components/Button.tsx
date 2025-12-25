import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils';
import { LuLoader } from 'react-icons/lu';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth, isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow active:shadow-none",
            secondary: "bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg",
            danger: "border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10",
            ghost: "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60",
            outline: "border border-gray-200 dark:border-white/10 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white"
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "py-3 px-4 text-sm",
            lg: "py-3.5 px-6 text-sm",
            icon: "p-2",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed clickable",
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <LuLoader className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
