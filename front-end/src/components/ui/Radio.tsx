import React from 'react';
import { cn } from './cn';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, id, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        type="radio"
        className={cn('text-action accent-action focus:ring-action', className)}
        {...props}
      />
    );

    if (!label) return input;

    return (
      <label htmlFor={id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
        {input}
        <span>{label}</span>
      </label>
    );
  }
);

Radio.displayName = 'Radio';
