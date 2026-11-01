import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/authContext";
import { mockApi } from "../../services/mockApi";
import { Payment } from "../../types";
import { Modal } from "../../components/modals/Modal";
import { MemberAvatar } from "../../components/common/MemberAvatar";
import { compressImageFile } from "../../utils/image";
import { ApiError } from "../../services/questClient";
import { formatMoney } from "../../config/currency";

export const ClientProfilePage: React.FC = () => {
  const { currentUser, logout, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [paymentCount, setPaymentCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allPayments, allUsers] = await Promise.all([mockApi.getPayments(), mockApi.getUsers()]);

        if (currentUser) {
          const userPayments = allPayments.filter((p) => p.user_id === currentUser.id);
          setPaymentCount(userPayments.length);

          const freshUser = allUsers.find((u) => u.id === currentUser.id);
          if (freshUser) {
            setCurrentUser(freshUser);
          }
        }
      } catch (err) {
        console.error("Failed to load profile data", err);
      }
    };

    fetchData();
  }, [currentUser?.id]);

  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/login", { replace: true });
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentUser) return;

    setAvatarMessage(null);
    setIsUploadingAvatar(true);
    try {
      const compressed = await compressImageFile(file);
      const updated = await mockApi.updateAvatar(compressed);
      setCurrentUser(updated);
      setAvatarMessage("Photo de profil mise à jour.");
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Impossible de mettre à jour la photo.";
      setAvatarMessage(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-5 pb-16 animate-in fade-in duration-200">
      {/* 1. Profile Hero Card */}
      <div className="bg-white rounded-[28px] p-5 shadow-xs border border-[#eceef3] flex items-center gap-4">
        <div className="relative shrink-0">
          <MemberAvatar
            src={currentUser.avatar}
            name={currentUser.name}
            className="w-16 h-16 ring-3 ring-secondary-container shadow-sm"
            textClassName="text-sm"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            id="btn-client-change-avatar"
            disabled={isUploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-action text-white shadow-md border-2 border-white flex items-center justify-center hover:bg-action-hover disabled:opacity-60"
            title="Changer la photo de profil"
            aria-label="Changer la photo de profil"
          >
            <span className={`material-symbols-outlined text-[16px] ${isUploadingAvatar ? "animate-spin" : ""}`}>
              {isUploadingAvatar ? "progress_activity" : "photo_camera"}
            </span>
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-sora text-lg font-bold text-[#181c20] truncate">{currentUser.name}</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
              Membre actif
            </span>
          </div>
          <p className="text-xs text-[#777585] font-mono mt-0.5">
            {currentUser.phone} · {currentUser.member_number}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#464554]">Solde d'avance :</span>
            <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              +{formatMoney(currentUser.solde_credit)}
            </span>
          </div>
          <p className="text-[11px] text-[#777585] mt-2">
            {isUploadingAvatar ? "Envoi de la photo…" : "Touchez l’appareil photo pour changer votre profil."}
          </p>
          {avatarMessage && (
            <p
              className={`text-[11px] font-medium mt-1 ${avatarMessage.includes("mise à jour") ? "text-emerald-700" : "text-red-600"}`}
            >
              {avatarMessage}
            </p>
          )}
        </div>
      </div>

      {/* Profile Menu List (Each item is a distinct route for history/back support) */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#777585] px-1">Menu de votre profil</h2>

        <div className="bg-white rounded-[28px] overflow-hidden shadow-xs border border-[#eceef3] divide-y divide-[#eceef3]">
          {/* Option 1: Mon compte */}
          <Link
            to="/client/profil/compte"
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#f7f9fe] transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div>
                <span className="font-sora text-sm font-bold text-[#181c20] block">Mon compte</span>
                <span className="text-xs text-[#777585]">Informations personnelles, numéro et groupes</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#777585] text-[20px] group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </Link>

          {/* Option 2: Historique de paiements */}
          <Link
            to="/client/profil/historique"
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#f7f9fe] transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div>
                <span className="font-sora text-sm font-bold text-[#181c20] block">Historique de paiements</span>
                <span className="text-xs text-[#777585]">
                  {paymentCount} versement{paymentCount > 1 ? "s" : ""} et reçus PDF officiels
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#777585] text-[20px] group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </Link>

          {/* Option 3: À propos de l'app */}
          <Link
            to="/client/profil/apropos"
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#f7f9fe] transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </div>
              <div>
                <span className="font-sora text-sm font-bold text-[#181c20] block">À propos de l'app</span>
                <span className="text-xs text-[#777585]">Version, sécurité locale chiffrée et portail public</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#777585] text-[20px] group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </Link>

          {/* Option 4: Déconnexion */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-red-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </div>
              <div>
                <span className="font-sora text-sm font-bold text-red-600 block">Déconnexion</span>
                <span className="text-xs text-red-400">Fermer la session membre sécurisée</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-red-400 text-[20px] group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </button>
        </div>

        {/* Quick link to return to cotisations */}
        <div className="pt-2">
          <Link
            to="/client/dashboard"
            className="w-full py-3 rounded-full bg-action hover:bg-action-hover text-white font-sora font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>Retour à mes cotisations</span>
          </Link>
        </div>
      </div>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        modalId="logout-confirm"
        panelClassName="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl border border-[#eceef3] flex flex-col gap-4 text-center my-auto"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[24px]">logout</span>
        </div>
        <div>
          <h3 className="font-sora text-base font-bold text-[#181c20]">Confirmer la déconnexion ?</h3>
          <p className="hidden lg:block text-xs text-[#777585] mt-1">
            Vous devrez saisir votre numéro et code PIN pour vous reconnecter.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(false)}
            className="py-2.5 px-4 rounded-full border border-[#e0e2e7] text-xs font-semibold text-[#777585] hover:bg-[#f7f9fe]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
          >
            Déconnexion
          </button>
        </div>
      </Modal>
    </div>
  );
};
