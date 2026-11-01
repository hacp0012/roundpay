import React from 'react';
import { cn } from './cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: 'light' | 'dark';
}

const toneClass = {
  light:
    'bg-[#f7f9fe] border-[#e0e2e7] text-[#181c20] placeholder:text-[#777585] caret-[#181c20] focus:bg-white focus:border-action focus:ring-action/20',
  dark:
    'bg-[#0b0d10] border-white/30 text-white placeholder:text-white/45 caret-white focus:bg-[#0b0d10] focus:border-white/55 focus:ring-white/25',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, tone = 'light', ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full min-w-0 px-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 disabled:opacity-50',
        toneClass[tone],
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
