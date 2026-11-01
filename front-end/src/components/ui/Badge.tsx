import React from 'react';
import { cn } from './cn';

type BadgeTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}

const toneClass: Record<BadgeTone, string> = {
  brand: 'bg-primary/10 text-primary',
  neutral: 'bg-[#f1f4f9] text-[#464554]',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-red-100 text-red-800',
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'brand', className, children }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold',
      toneClass[tone],
      className
    )}
  >
    {children}
  </span>
);
