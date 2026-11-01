import React, { useState } from "react";
import { User, FicheContribution, MemberFicheRecord } from "../../types";
import { MemberAvatar } from "../common/MemberAvatar";
import { formatMoney, currencySymbol } from "../../config/currency";

interface VersementsViewProps {
  users: User[];
  fiches: FicheContribution[];
  records: Record<string, MemberFicheRecord[]>;
  onUseCredit: (user_id: string, fiche_id: string, amount: number) => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const VersementsView: React.FC<VersementsViewProps> = ({ users, fiches, records, onUseCredit, onShowToast }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedFicheId, setSelectedFicheId] = useState<string>(fiches[0]?.id || "fiche-1");
  const [amountToImpute, setAmountToImpute] = useState<string>("25");
  const [isProcessing, setIsProcessing] = useState(false);

  const usersWithCredit = users.filter((u) => u.solde_credit > 0);
  const totalCreditPool = users.reduce((sum, u) => sum + (u.solde_credit || 0), 0);

  const handleManualImpute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedFicheId) {
      onShowToast("Sélectionnez un membre et une fiche cible.");
      return;
    }

    setIsProcessing(true);
    try {
      await onUseCredit(selectedUserId, selectedFicheId, parseFloat(amountToImpute) || 25);
      onShowToast("Imputation de crédit réalisée avec succès !");
      setSelectedUserId("");
    } catch (err: any) {
      onShowToast(err.message || "Erreur lors de l'imputation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAutoImpute = async () => {
    setIsProcessing(true);
    let count = 0;
    try {
      for (const user of usersWithCredit) {
        // Look for any unpaid sheet for this user
        for (const fiche of fiches) {
          if (fiche.type === "obligatoire") {
            const userRecords = records[fiche.id] || [];
            const userRecord = userRecords.find((r) => r.user_id === user.id);
            if (userRecord && userRecord.reste > 0 && user.solde_credit > 0) {
              const toUse = Math.min(user.solde_credit, userRecord.reste);
              await onUseCredit(user.id, fiche.id, toUse);
              count++;
              break;
            }
          }
        }
      }
      onShowToast(
        count > 0
          ? `${count} imputation(s) automatique(s) effectuées pour régulariser les cotisations !`
          : "Toutes les cotisations éligibles sont déjà régularisées !",
      );
    } catch (err: any) {
      onShowToast(err.message || "Erreur lors de l'imputation groupée.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">PORTEFEUILLE &amp; AVANCES</span>
        <h1 className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">
          Versements d'avance &amp; Crédits
        </h1>
        <p className="text-sm text-[#464554]">
          Gestion des surplus de paiement et déductions automatiques sur les cotisations futures.
        </p>
      </div>

      {/* Hero Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-secondary-container text-[#001943] p-6 rounded-[28px] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2e4676]">Total des soldes d'avance</span>
          <span className="font-sora text-4xl font-bold my-2">+{formatMoney(totalCreditPool)}</span>
          <span className="text-xs text-[#3a5183]">Fonds conservés en fiducie pour les prochains mois</span>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#eceef3] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#777585]">Membres avec solde créditeur</span>
          <span className="font-sora text-3xl font-bold text-[#181c20] my-2">{usersWithCredit.length} membres</span>
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Cotisations pré-financées
          </span>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#eceef3] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#777585]">Règle de ventilation</span>
          <div className="text-xs text-[#464554] my-2 leading-relaxed">
            Tout paiement supérieur au montant imposé est reversé automatiquement dans le portefeuille d'avance du membre.
          </div>
          <button
            type="button"
            onClick={handleBulkAutoImpute}
            disabled={isProcessing}
            className="w-full py-2 px-3 rounded-full bg-action hover:bg-action-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Imputer automatiquement les dettes</span>
          </button>
        </div>
      </section>

      {/* Main Grid: Table of Members with Credit + Manual Imputation Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: List of Members with credit */}
        <div className="min-w-0 lg:col-span-8 bg-white rounded-[28px] p-5 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sora text-base font-bold text-[#181c20]">Portefeuilles des membres</h2>
            <span className="text-xs text-[#777585]">{users.length} membres répertoriés</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#eceef3] text-[#777585] uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-2.5 px-3">Membre</th>
                  <th className="py-2.5 px-2">Téléphone</th>
                  <th className="py-2.5 px-3">Solde d'Avance</th>
                  <th className="py-2.5 px-2">Équivalence</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef3]/60">
                {users.map((u) => {
                  const hasCredit = u.solde_credit > 0;
                  const monthsAdvance = Math.floor(u.solde_credit / 25);

                  return (
                    <tr key={u.id} className="hover:bg-[#f7f9fe] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar src={u.avatar} name={u.name} className="w-8 h-8" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-[#181c20]">{u.name}</span>
                            <span className="font-mono text-[10px] text-[#777585]">{u.member_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs text-[#464554]">{u.phone}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                            hasCredit ? "bg-secondary-container text-[#001943]" : "bg-[#f1f4f9] text-[#777585]"
                          }`}
                        >
                          {hasCredit ? `+${formatMoney(u.solde_credit)}` : formatMoney(0)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {hasCredit ? (
                          <span className="text-xs font-semibold text-emerald-700">
                            {monthsAdvance > 0 ? `${monthsAdvance} mois d'avance` : "Avance partielle"}
                          </span>
                        ) : (
                          <span className="text-xs text-[#777585]">À jour</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {hasCredit ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setAmountToImpute(String(Math.min(25, u.solde_credit)));
                            }}
                            className="px-3 py-1 bg-action hover:bg-action-hover text-white rounded-full text-[11px] font-bold transition-all"
                          >
                            Imputer
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#777585]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Impute Credit to a Sheet */}
        <div className="lg:col-span-4 bg-white rounded-[32px] p-6 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] flex flex-col gap-4 sticky top-24">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#111418] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">sync_alt</span>
            </div>
            <div>
              <h2 className="font-sora text-base font-bold text-[#181c20]">Imputer un crédit</h2>
              <p className="text-xs text-[#777585]">Régulariser une fiche avec le solde du membre</p>
            </div>
          </div>

          <form onSubmit={handleManualImpute} className="flex flex-col gap-4">
            {/* Member */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Membre créditeur</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-xs text-[#181c20]"
              >
                <option value="">-- Choisir un membre --</option>
                {usersWithCredit.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (Solde : +{formatMoney(u.solde_credit)})
                  </option>
                ))}
              </select>
            </div>

            {/* Fiche */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Fiche à régulariser</label>
              <select
                value={selectedFicheId}
                onChange={(e) => setSelectedFicheId(e.target.value)}
                className="w-full px-3 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-xs text-[#181c20]"
              >
                {fiches
                  .filter((f) => f.type === "obligatoire")
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} - {f.titre} ({formatMoney(f.montant_impose || 0)})
                    </option>
                  ))}
              </select>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Montant à déduire ({currencySymbol()})</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={amountToImpute}
                onChange={(e) => setAmountToImpute(e.target.value)}
                className="w-full px-3 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm font-bold text-[#181c20]"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !selectedUserId}
              className="w-full py-3 px-4 rounded-full bg-action hover:bg-action-hover text-white font-sora font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Confirmer l'imputation</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
