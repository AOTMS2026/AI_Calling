import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> { }

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div className={twMerge(clsx('bg-white border border-gray-200 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden', className))} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: CardProps) {
    return (
        <div className={twMerge(clsx('px-6 py-4 border-b border-gray-100 flex flex-col gap-1.5', className))} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: CardProps) {
    return (
        <h3 className={twMerge(clsx('text-lg font-semibold leading-none tracking-tight text-gray-900', className))} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }: CardProps) {
    return (
        <div className={twMerge(clsx('p-6 pt-5', className))} {...props}>
            {children}
        </div>
    );
}
