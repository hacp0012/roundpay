import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Modal } from '../modals/Modal';
import { APP_NAME } from '../../config/branding';
import { Button } from '../ui';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <Button
        type="button"
        id="btn-pwa-install"
        onClick={install}
        size="sm"
        className={className}
      >
        <span className="material-symbols-outlined text-[16px]">install_mobile</span>
        <span className="whitespace-nowrap">Installer l'app</span>
      </Button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          id="btn-pwa-ios-guide"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-full border border-secondary-container/40 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#181c20] hover:bg-white transition-all active:scale-95 ${className}`}
        >
          <span className="material-symbols-outlined text-[16px] text-primary">add_to_home_screen</span>
          <span className="whitespace-nowrap">Installer sur iPhone</span>
        </button>

        <Modal
          isOpen={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          modalId="pwa-ios-guide"
          panelClassName="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#eceef3] my-auto"
        >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#111418] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
                  </div>
                  <h3 className="text-base font-bold font-sora text-[#181c20]">Installer {APP_NAME}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="hidden lg:block text-xs text-[#777585] leading-relaxed mb-4">
                Pour utiliser {APP_NAME} comme une véritable application sur votre iPhone ou iPad :
              </p>

              <ol className="space-y-3 text-xs text-[#181c20] mb-5">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary-container/30 text-[#001943] font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Touchez le bouton <strong>Partager</strong> <span className="material-symbols-outlined inline-block text-[14px] align-middle text-primary">ios_share</span> dans la barre Safari.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary-container/30 text-[#001943] font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-secondary-container/30 text-[#001943] font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span>Appuyez sur <strong>Ajouter</strong> en haut à droite.</span>
                </li>
              </ol>

              <Button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-2xl"
              >
                Compris
              </Button>
        </Modal>
      </>
    );
  }

  return null;
};
