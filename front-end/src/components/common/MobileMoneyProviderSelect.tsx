import React from 'react';
import { MobileMoneyProvider } from '../../types';
import { PROVIDERS_CONFIG } from './MobileMoneyBadges';
import { Label, Select } from '../ui';

interface MobileMoneyProviderSelectProps {
  value: MobileMoneyProvider;
  onChange: (provider: MobileMoneyProvider) => void;
  label?: string;
  providers?: MobileMoneyProvider[];
  id?: string;
}

const DEFAULT_PROVIDERS = Object.keys(PROVIDERS_CONFIG) as MobileMoneyProvider[];

export const MobileMoneyProviderSelect: React.FC<MobileMoneyProviderSelectProps> = ({
  value,
  onChange,
  label = 'Réseau de paiement',
  providers = DEFAULT_PROVIDERS,
  id = 'select-mobile-money-provider',
}) => {
  const selected = PROVIDERS_CONFIG[value] || PROVIDERS_CONFIG.orange_money;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={id} className="mb-0">
          {label}
        </Label>
      )}
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: selected.color }}
        />
        <Select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as MobileMoneyProvider)}
          className="appearance-none pl-7 pr-10 py-2.5"
        >
          {providers.map((providerId) => (
            <option key={providerId} value={providerId}>
              {PROVIDERS_CONFIG[providerId].name}
            </option>
          ))}
        </Select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-[#777585]">
          expand_more
        </span>
      </div>
    </div>
  );
};
