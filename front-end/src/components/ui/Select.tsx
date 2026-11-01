import React from 'react';
import { cn } from './cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full min-w-0 px-3.5 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-xs font-semibold text-[#181c20] focus:outline-none focus:bg-white focus:border-action focus:ring-1 focus:ring-action/20 disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = 'Select';
