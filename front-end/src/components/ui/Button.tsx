import React from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-action text-white hover:bg-action-hover shadow-sm disabled:opacity-50',
  outline:
    'bg-white text-[#181c20] border border-[#e0e2e7] hover:bg-[#f7f9fe] disabled:opacity-50',
  ghost:
    'bg-transparent text-[#464554] hover:bg-[#f1f4f9] hover:text-[#181c20] disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-xs disabled:opacity-50',
  soft:
    'bg-[#f1f4f9] text-[#181c20] hover:bg-[#e4e7ee] disabled:opacity-50',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[11px] gap-1',
  md: 'px-4 py-2.5 text-xs gap-1.5',
  lg: 'px-5 py-3 text-xs gap-2 font-sora',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, type = 'button', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-full transition-all active:scale-95 disabled:pointer-events-none',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
