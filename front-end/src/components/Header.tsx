import React from "react";
import { User } from "../types";
import { MemberAvatar } from "./common/MemberAvatar";

interface HeaderProps {
  currentUser: User;
  appMode: "admin" | "contributor";
  onToggleAppMode: (mode: "admin" | "contributor") => void;
  showMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  onSearch?: (query: string) => void;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  appMode,
  onToggleAppMode,
  showMobileFrame,
  onToggleMobileFrame,
  onSearch,
}) => {
  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-[#f7f9fe]/90 backdrop-blur-xl z-40 px-8 flex items-center justify-between border-b border-[#eceef3]/80">
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777585] text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher un groupe, un membre, une fiche..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-white rounded-full text-sm text-[#181c20] placeholder:text-[#777585] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent focus:border-secondary-container focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Mode Toggle & Profile */}
      <div className="flex items-center gap-3">
        {/* App Mode Switcher Pill */}
        <div className="bg-[#111418] p-1 rounded-full flex items-center shadow-md">
          <button
            type="button"
            onClick={() => onToggleAppMode("admin")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              appMode === "admin" ? "bg-white text-[#111418] shadow-sm" : "text-white/70 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleAppMode("contributor")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              appMode === "contributor" ? "bg-white text-[#111418] shadow-sm" : "text-white/70 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smartphone</span>
            <span>Contributeur</span>
          </button>
        </div>

        {/* Mobile Device Frame Toggle Button (when in contributor mode) */}
        {appMode === "contributor" && (
          <button
            type="button"
            onClick={onToggleMobileFrame}
            title={showMobileFrame ? "Plein écran" : "Vue châssis smartphone"}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 border transition-all ${
              showMobileFrame
                ? "bg-[#e2dfff] text-primary border-secondary-container"
                : "bg-white text-[#464554] border-[#e0e2e7] hover:bg-[#f1f4f9]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">devices</span>
            <span className="hidden sm:inline">{showMobileFrame ? "Châssis Mobile" : "Plein Écran"}</span>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          type="button"
          className="relative p-2.5 rounded-full bg-white hover:bg-[#eceef3] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[#464554] transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#e0e2e7]">
          <MemberAvatar src={currentUser.avatar} name={currentUser.name} className="w-9 h-9 shadow-sm ring-2 ring-white" />
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold text-[#181c20] leading-tight">{currentUser.name}</span>
            <span className="text-[11px] text-[#777585] leading-tight">
              {appMode === "admin" ? "Trésorière Générale" : "Membre Cotisant"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
