import React from 'react';
import { RoundPayLogo } from './common/RoundPayLogo';

export type AdminViewType =
  | 'dashboard'
  | 'groups'
  | 'fiches'
  | 'fiche_detail'
  | 'collectes'
  | 'versements'
  | 'depenses'
  | 'settings';

interface SidebarProps {
  currentView: AdminViewType;
  onNavigate: (view: AdminViewType) => void;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard' as AdminViewType, label: 'Tableau de bord', icon: 'grid_view' },
    { id: 'groups' as AdminViewType, label: 'Groupes & Tontines', icon: 'account_balance_wallet' },
    { id: 'fiches' as AdminViewType, label: 'Fiches de cotisation', icon: 'description' },
    { id: 'collectes' as AdminViewType, label: 'Collectes libres & Dons', icon: 'volunteer_activism' },
    { id: 'versements' as AdminViewType, label: 'Versements & Crédits', icon: 'sync_alt' },
    { id: 'depenses' as AdminViewType, label: 'Dépenses & Caisse', icon: 'receipt_long' },
    { id: 'settings' as AdminViewType, label: 'Paramètres', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-64 bg-secondary-container rounded-[28px] shadow-[0_16px_36px_-12px_rgb(var(--app-color-rgb)/0.12)] z-50 flex flex-col p-4 justify-between transition-all">
      <div className="flex flex-col gap-6">
        {/* Header Logo */}
        <div className="flex items-center gap-2 px-2 pt-1">
          <RoundPayLogo textColor="text-[#001943]" size="md" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive =
              currentView === item.id ||
              (item.id === 'fiches' && currentView === 'fiche_detail');

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all text-sm text-left ${
                  isActive
                    ? 'bg-[#181c20] text-white font-semibold shadow-md'
                    : 'text-[#2e4676] hover:bg-white/50 hover:text-[#181c20] font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Capsule */}
      <div className="p-3 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-white/50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
          <span className="text-xs font-semibold text-[#3a5183]">
            Caisse collective active
          </span>
        </div>
        <span className="material-symbols-outlined text-[18px] text-[#3a5183]">
          shield
        </span>
      </div>
    </aside>
  );
};
