import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/authContext";
import { mockApi } from "../../services/mockApi";
import { Group } from "../../types";
import { formatMoney } from "../../config/currency";

export const ClientAccountPage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allGroups, allUsers] = await Promise.all([mockApi.getGroups(), mockApi.getUsers()]);
        if (currentUser) {
          const freshUser = allUsers.find((u) => u.id === currentUser.id);
          if (freshUser) {
            setCurrentUser(freshUser);
          }
        }
        setGroups(allGroups);
      } catch (err) {
        console.error("Failed to load groups", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const memberGroups = groups.filter((g) => currentUser.group_ids?.includes(g.id));

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 pb-12 animate-in fade-in duration-200">
      {/* Navigation bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/client/profil")}
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-container transition-colors py-1 px-2 rounded-lg hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Retour au Profil</span>
        </button>

        <span className="text-[11px] font-bold text-[#777585] uppercase tracking-wider">Mon Compte</span>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-xs border border-[#eceef3] flex flex-col gap-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#eceef3]">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">badge</span>
          </div>
          <div>
            <h1 className="font-sora text-base font-bold text-[#181c20]">Informations du compte membre</h1>
            <p className="text-xs text-[#777585]">Vos coordonnées et rattachements enregistrés par l'administrateur</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-[#f7f9fe] rounded-2xl border border-[#eceef3]">
            <span className="text-[#777585] text-[10px] uppercase font-bold block">Nom et prénom</span>
            <span className="font-bold text-[#181c20] text-sm mt-0.5 block">{currentUser.name}</span>
          </div>

          <div className="p-3.5 bg-[#f7f9fe] rounded-2xl border border-[#eceef3]">
            <span className="text-[#777585] text-[10px] uppercase font-bold block">Matricule membre</span>
            <span className="font-mono font-bold text-primary text-sm mt-0.5 block">{currentUser.member_number}</span>
          </div>

          <div className="p-3.5 bg-[#f7f9fe] rounded-2xl border border-[#eceef3]">
            <span className="text-[#777585] text-[10px] uppercase font-bold block">Numéro de téléphone</span>
            <span className="font-mono font-semibold text-[#181c20] text-sm mt-0.5 block">{currentUser.phone}</span>
            <span className="text-[10px] text-[#777585] mt-1 block">
              Utilisé pour la connexion et pour les encaissements Mobile Money
            </span>
          </div>

          <div className="p-3.5 bg-[#f7f9fe] rounded-2xl border border-[#eceef3]">
            <span className="text-[#777585] text-[10px] uppercase font-bold block">Solde d'avance disponible</span>
            <span className="font-sora font-bold text-emerald-700 text-sm mt-0.5 block">
              +{formatMoney(currentUser.solde_credit)}
            </span>
            <span className="text-[10px] text-[#777585] mt-1 block">
              Automatiquement déductible lors des prochaines cotisations
            </span>
          </div>
        </div>

        {/* Groups and Tontines */}
        <div className="mt-2 pt-3 border-t border-[#eceef3]">
          <span className="text-[11px] font-bold text-[#181c20] block mb-2">
            Groupes & Tontines de rattachement ({memberGroups.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {memberGroups.length === 0 ? (
              <span className="text-xs text-[#777585] italic">Aucun groupe spécifique attribué par l'administrateur.</span>
            ) : (
              memberGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f1f4f9] border border-[#e0e2e7] text-xs font-semibold text-[#181c20]"
                >
                  <span className="material-symbols-outlined text-primary text-[16px]">account_balance_wallet</span>
                  <span>{group.name}</span>
                  {group.periodicite && <span className="text-[10px] text-[#777585]">({group.periodicite})</span>}
                </div>
              ))
            )}
          </div>
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
