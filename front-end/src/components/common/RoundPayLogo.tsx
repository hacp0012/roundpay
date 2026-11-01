import React from 'react';
import { APP_NAME, splitAppName } from '../../config/branding';

interface RoundPayLogoProps {
  className?: string;
  showText?: boolean;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RoundPayLogo: React.FC<RoundPayLogoProps> = ({
  className = '',
  showText = true,
  textColor = 'text-on-surface',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const { lead, accent } = splitAppName(APP_NAME);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${iconSizes[size]} rounded-xl bg-[#111418] p-1 shadow-sm flex items-center justify-center relative overflow-hidden shrink-0`}>
        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
          <rect x="12" y="10" width="18" height="12" rx="6" fill="var(--app-color-soft)" fillOpacity="0.4" />
          <path d="M10 16L10 24L14 20Z" fill="var(--app-color-soft)" fillOpacity="0.3" />
          <circle cx="17" cy="17" r="7" fill="var(--app-color-soft)" />
          <circle cx="26" cy="22" r="5" fill="#ffffff" />
          <path d="M9 31C9 25.5 13.5 23 17 23C20.5 23 25 25.5 25 31H9Z" fill="var(--app-color)" />
        </svg>
      </div>

      {showText && (
        <span className={`font-sora font-bold tracking-tight ${textSizes[size]} ${textColor}`}>
          {lead}
          {accent ? <span className="text-primary">{accent}</span> : null}
        </span>
      )}
    </div>
  );
};
