import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { RoundPayLogo } from '../../components/common/RoundPayLogo';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { mockApi } from '../../services/mockApi';
import { PublicPortalSettings } from '../../types';
import { APP_NAME } from '../../config/branding';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<PublicPortalSettings | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    mockApi.getPublicSettings().then(setSettings);
  }, []);

  const isHome = location.pathname === '/';
  const isContact = location.pathname === '/contact';

  return (
    <div className="min-h-screen bg-[#f7f9fe] text-[#181c20] flex flex-col selection:bg-primary selection:text-white">
      <OfflineIndicator />

      {/* Clean, uncluttered Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#eceef3] px-3 sm:px-6 py-3 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <RoundPayLogo size="md" />
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-bold text-primary bg-secondary-container/30 px-2.5 py-0.5 rounded-full">
              Portail Public
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f1f4f9] p-1 rounded-full text-xs font-semibold text-[#464554]">
            <Link
              to="/"
              className={`px-4 py-1.5 rounded-full transition-all ${
                isHome
                  ? 'bg-white text-[#181c20] shadow-xs font-bold'
                  : 'hover:text-[#181c20]'
              }`}
            >
              Collectes Publiques
            </Link>
            <Link
              to="/contact"
              className={`px-4 py-1.5 rounded-full transition-all ${
                isContact
                  ? 'bg-white text-[#181c20] shadow-xs font-bold'
                  : 'hover:text-[#181c20]'
              }`}
            >
              À propos & Contact
            </Link>
          </nav>

          {/* Right Action Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton />

            <Link
              to="/login"
              id="link-member-space"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Espace Membre</span>
            </Link>

            <Link
              to="/admin/login"
              id="link-admin-space"
              title="Accès Trésorier & Administration"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-[#e0e2e7] hover:border-secondary-container text-[#464554] hover:text-[#181c20] text-xs font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              <span>Admin</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-xl border border-[#e0e2e7] text-[#181c20]"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-[#eceef3] mt-3 flex flex-col gap-2 animate-in fade-in">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                isHome ? 'bg-primary/10 text-primary' : 'text-[#464554]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
              <span>Collectes Publiques</span>
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                isContact ? 'bg-primary/10 text-primary' : 'text-[#464554]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">contact_support</span>
              <span>À propos & Contact</span>
            </Link>
            <div className="pt-2 border-t border-[#eceef3] flex items-center justify-between">
              <Link
                to="/admin/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs text-[#777585] hover:text-[#181c20] flex items-center gap-1 font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>Espace Trésorier</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <Outlet />
      </main>

      {/* Clean, understated Footer */}
      <footer className="bg-white border-t border-[#eceef3] py-6 px-3 sm:px-6 text-xs text-[#777585]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex items-center gap-2">
              <RoundPayLogo size="sm" />
              <span className="font-bold text-[#181c20]">
                {settings?.nom_collectif || `${APP_NAME} Solidarité`}
              </span>
            </div>
            <p className="text-[11px] text-[#777585] text-center sm:text-left max-w-md">
              {settings?.slogan || 'Gestion participative, tontines et caisses d\'entraide en toute transparence.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <Link to="/" className="hover:text-[#181c20] transition-colors">
              Collectes
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-[#181c20] transition-colors">
              Contact & À propos
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-[#181c20] transition-colors">
              Connexion Membre
            </Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-[#181c20] transition-colors">
              Administration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
