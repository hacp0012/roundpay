import React from 'react';
import { cn } from './cn';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  tone?: 'light' | 'dark';
}

export const Label: React.FC<LabelProps> = ({ className, tone = 'light', ...props }) => (
  <label
    className={cn(
      'block text-xs font-bold mb-1.5',
      tone === 'dark' ? 'text-white/80' : 'text-[#181c20]',
      className
    )}
    {...props}
  />
);
