import React from 'react';
import { cn } from './cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3.5 py-2 bg-white border border-[#e0e2e7] rounded-xl text-xs text-[#181c20] placeholder:text-[#777585] focus:outline-none focus:border-action focus:ring-1 focus:ring-action/20 resize-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';
