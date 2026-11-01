import React from 'react';
import { cn } from './cn';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: string;
  size?: 'sm' | 'md';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, size = 'md', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full text-[#777585] hover:text-[#181c20] hover:bg-[#f1f4f9] transition-colors disabled:opacity-50',
        size === 'sm' ? 'w-7 h-7' : 'w-8 h-8',
        className
      )}
      {...props}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: size === 'sm' ? 16 : 18 }}
      >
        {icon}
      </span>
    </button>
  )
);

IconButton.displayName = 'IconButton';
