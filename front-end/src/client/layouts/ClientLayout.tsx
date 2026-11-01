import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/authContext';
import { RoundPayLogo } from '../../components/common/RoundPayLogo';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { Spinner } from '../../components/ui';
import { MemberAvatar } from '../../components/common/MemberAvatar';

export const ClientLayout: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#f7f9fe] flex flex-col items-center justify-center gap-3">
        <Spinner />
        <span className="font-sora text-xs font-semibold text-[#181c20]">
          Chargement de votre espace membre...
        </span>
      </div>
    );
  }

  const isProfile = location.pathname.includes('/client/profil');

  return (
    <div className="h-screen h-dvh overflow-hidden bg-[#f7f9fe] text-[#181c20] flex flex-col selection:bg-primary selection:text-white">
      <OfflineIndicator />

      {/* Main Single Mobile App Bar */}
      <header className="relative z-50 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#eceef3] shadow-xs">
        <div className="w-full max-w-xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isProfile ? (
            <Link
              to="/client/dashboard"
              className="flex items-center gap-1 text-xs font-bold text-[#181c20] hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span className="font-sora">Mon Profil</span>
            </Link>
          ) : (
            <Link to="/client/dashboard" className="flex items-center gap-2">
              <RoundPayLogo size="sm" />
              <span className="hidden xs:inline-block text-[10px] font-bold text-primary bg-secondary-container/30 px-2 py-0.5 rounded-full">
                Membre
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />

          {currentUser.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-full transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Profile Button in primary App Bar */}
          <Link
            to={isProfile ? "/client/dashboard" : "/client/profil"}
            id="btn-client-profile"
            className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full transition-all border ${
              isProfile
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-white hover:bg-[#f7f9fe] text-[#181c20] border-[#e0e2e7] shadow-xs'
            }`}
            title={isProfile ? "Retour aux cotisations" : "Accéder à mon profil"}
          >
            <MemberAvatar
              src={currentUser.avatar}
              name={currentUser.name}
              className="w-7 h-7 ring-2 ring-secondary-container"
            />
            <span className="text-xs font-bold truncate max-w-[85px]">
              {isProfile ? "Cotisations" : currentUser.name.split(' ')[0]}
            </span>
            <span className="material-symbols-outlined text-[16px]">
              {isProfile ? "payments" : "chevron_right"}
            </span>
          </Link>
        </div>
        </div>
      </header>

      {/* Main Content Area (Fluid responsive, no artificial frame) */}
      <main className="min-h-0 flex-1 w-full max-w-xl mx-auto overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3 sm:px-5">
        <Outlet />
      </main>
    </div>
  );
};
