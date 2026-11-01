import React from 'react';
import { cn } from './cn';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={cn(
          'rounded border-[#e0e2e7] text-action accent-action focus:ring-action w-4 h-4',
          className
        )}
        {...props}
      />
    );

    if (!label) return input;

    return (
      <label htmlFor={id} className="flex items-center gap-2 text-xs text-[#464554] cursor-pointer select-none">
        {input}
        <span>{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
