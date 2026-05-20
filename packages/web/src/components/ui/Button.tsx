import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  primary: 'bg-wg-blue hover:bg-wg-blue/80 text-white',
  secondary: 'bg-wg-card hover:bg-wg-card-hover border border-wg-border text-wg-text',
  ghost: 'hover:bg-wg-card text-wg-text2 hover:text-wg-text',
  danger: 'bg-wg-red/10 hover:bg-wg-red/20 text-wg-red border border-wg-red/20',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
