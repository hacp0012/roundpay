import React from 'react';
import { cn } from './cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  sm: 'w-4 h-4 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-12 h-12 border-4',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
  <div
    role="status"
    aria-label="Chargement"
    className={cn(
      'rounded-full border-secondary-container border-t-action animate-spin',
      sizeClass[size],
      className
    )}
  />
);
