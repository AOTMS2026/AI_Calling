import React from 'react';
import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, rightElement, ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5">
                {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
                <div className="relative">
                    <input
                        ref={ref}
                        className={twMerge(
                            clsx(
                                'w-full px-3 py-2 bg-white border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 transition-colors',
                                error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
                                rightElement ? 'pr-10' : '',
                                className
                            )
                        )}
                        {...props}
                    />
                    {rightElement && (
                        <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                            {rightElement}
                        </div>
                    )}
                </div>
                {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
