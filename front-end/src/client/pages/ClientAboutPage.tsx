import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { APP_NAME } from '../../config/branding';

export const ClientAboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 pb-12 animate-in fade-in duration-200">
      {/* Navigation bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/client/profil')}
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-container transition-colors py-1 px-2 rounded-lg hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Retour au Profil</span>
        </button>

        <span className="text-[11px] font-bold text-[#777585] uppercase tracking-wider">
          À Propos
        </span>
      </div>

      {/* About App Card */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-xs border border-[#eceef3] flex flex-col gap-4 text-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#eceef3]">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">info</span>
          </div>
          <div>
            <h1 className="font-sora text-base font-bold text-[#181c20]">
              À propos de {APP_NAME}
            </h1>
            <p className="text-xs text-[#777585]">
              Plateforme progressive de gestion de tontines, cagnottes et cotisations
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-[#464554] leading-relaxed">
          <p>
            <strong>{APP_NAME}</strong> est une application progressive (PWA) conçue pour la gestion transparente et collaborative des tontines, cagnottes solidaires et cotisations mutuelles de communautés.
          </p>

          <div className="p-4 bg-[#f7f9fe] rounded-2xl border border-[#eceef3] flex flex-col gap-2.5">
            <span className="font-bold text-[#181c20] text-xs">Sécurité & Confidentialité locale :</span>
            <ul className="list-disc pl-4 space-y-1 text-[#777585]">
              <li>Données chiffrées localement sur votre terminal via algorithme AES-256 (<code className="text-primary font-mono">encrypt-storage</code>).</li>
              <li>Fonctionnement résilient en mode hors-ligne : vos reçus restent consultables sans réseau.</li>
              <li>Paiements Mobile Money sécurisés via push USSD sans conservation de code PIN secret.</li>
              <li>Traçabilité totale des cotisations avec imputation automatique des surplus vers le portefeuille d'avance.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Link
              to="/"
              className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#f1f4f9] hover:bg-[#e4e7ee] text-[#181c20] font-bold text-center transition-colors"
            >
              Voir le portail public des collectes
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-[#e0e2e7] hover:bg-[#f7f9fe] text-primary font-bold text-center transition-colors"
            >
              Contacter le secrétariat & permanence
            </Link>
          </div>
        </div>

        <div className="pt-3 border-t border-[#eceef3] text-[10px] text-[#777585] flex items-center justify-between">
          <span>Version : v2.4.0 (PWA)</span>
          <span>{APP_NAME} Collectif</span>
        </div>
      </div>

      {/* Action link */}
      <Link
        to="/client/dashboard"
        className="w-full py-3 rounded-full bg-action hover:bg-action-hover text-white font-sora font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[16px]">payments</span>
        <span>Accéder à mes cotisations</span>
      </Link>
    </div>
  );
};
