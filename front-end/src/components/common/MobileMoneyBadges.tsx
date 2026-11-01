import React from 'react';
import { MobileMoneyProvider } from '../../types';

interface ProviderBadgeProps {
  provider: MobileMoneyProvider;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const PROVIDERS_CONFIG: Record<
  MobileMoneyProvider,
  { name: string; shortName: string; color: string; bg: string; text: string; icon: string }
> = {
  orange_money: {
    name: 'Orange Money',
    shortName: 'Orange',
    color: '#ff7900',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    icon: 'smartphone',
  },
  mpesa: {
    name: 'M-Pesa (Vodacom)',
    shortName: 'M-Pesa',
    color: '#e60000',
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'payments',
  },
  airtel_money: {
    name: 'Airtel Money',
    shortName: 'Airtel',
    color: '#ed1c24',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: 'send_to_mobile',
  },
  mtn_momo: {
    name: 'MTN Mobile Money',
    shortName: 'MTN MoMo',
    color: '#ffcc00',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    icon: 'phone_android',
  },
  wave: {
    name: 'Wave',
    shortName: 'Wave',
    color: '#1dc4ff',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    icon: 'waves',
  },
  cash_guichet: {
    name: 'Espèces / Guichet',
    shortName: 'Guichet',
    color: '#181c20',
    bg: 'bg-surface-container',
    text: 'text-on-surface',
    icon: 'point_of_sale',
  },
};

export const MobileMoneyBadge: React.FC<ProviderBadgeProps> = ({
  provider,
  size = 'md',
  showLabel = true,
}) => {
  const config = PROVIDERS_CONFIG[provider] || PROVIDERS_CONFIG.orange_money;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: config.color }}
      />
      {showLabel && <span>{config.name}</span>}
    </span>
  );
};
