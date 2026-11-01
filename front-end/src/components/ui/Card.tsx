import React from 'react';
import { cn } from './cn';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => (
  <div
    className={cn(
      'bg-white rounded-[28px] p-5 sm:p-6 shadow-xs border border-[#eceef3]',
      className
    )}
  >
    {children}
  </div>
);
