import React, { useState } from "react";
import { FicheContribution, MemberFicheRecord, User, MobileMoneyProvider, PaymentRecordResult } from "../../types";
import { MobileMoneyProviderSelect } from "../common/MobileMoneyProviderSelect";
import { MemberAvatar } from "../common/MemberAvatar";
import { formatMoney, currencySymbol } from "../../config/currency";
import { mockApi } from "../../services/mockApi";

interface FicheDetailViewProps {
  fiche: FicheContribution;
  records: MemberFicheRecord[];
  users: User[];
  onBack: () => void;
  onRecordPayment: (payload: {
    fiche_id: string;
    user_id: string;
    montant: number;
    mobile_provider: MobileMoneyProvider;
    note?: string;
  }) => Promise<PaymentRecordResult>;
  onUseCredit: (user_id: string, fiche_id: string, amount: number) => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const FicheDetailView: React.FC<FicheDetailViewProps> = ({
  fiche,
  records,
  users,
  onBack,
  onRecordPayment,
  onUseCredit,
  onShowToast,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "paye" | "partiel" | "retard">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Quick payment form state
  const [selectedUserId, setSelectedUserId] = useState<string>(
    records.find((r) => r.reste > 0)?.user_id || users[1]?.id || "",
  );
  const [amountInput, setAmountInput] = useState<string>("25");
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider>("orange_money");
  const [isProcessing, setIsProcessing] = useState(false);

  // Selected member for ventilation preview
  const selectedMemberRecord = records.find((r) => r.user_id === selectedUserId);
  const selectedMemberUser = users.find((u) => u.id === selectedUserId);

  const imposedAmount = fiche.montant_impose || 25;
  const currentDue = selectedMemberRecord ? selectedMemberRecord.reste : imposedAmount;
  const enteredAmount = parseFloat(amountInput) || 0;

  // Real-time ventilation calculation
  const regleFiche = Math.min(enteredAmount, currentDue);
  const crediteSolde = Math.max(0, enteredAmount - currentDue);

  // Totals
  const totalImposed = records.reduce((sum, r) => sum + r.montant_impose, 0) || 600;
  const totalPaid = records.reduce((sum, r) => sum + r.montant_paye, 0) || 475;
  const percentage = Math.min(100, Math.round((totalPaid / totalImposed) * 100));

  const countPaye = records.filter((r) => r.statut === "paye" || r.statut === "paye_avance").length;
  const countPartiel = records.filter((r) => r.statut === "partiel").length;
  const countRetard = records.filter((r) => r.statut === "retard").length;

  const totalCreditAdvances = users
    .filter((u) => records.some((r) => r.user_id === u.id))
    .reduce((sum, u) => sum + (u.solde_credit || 0), 0);

  const filteredRecords = records.filter((r) => {
    const user = users.find((u) => u.id === r.user_id);
    const matchesSearch =
      !searchQuery ||
      user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.member_number.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === "all") return true;
    if (selectedFilter === "paye") return r.statut === "paye" || r.statut === "paye_avance";
    if (selectedFilter === "partiel") return r.statut === "partiel";
    if (selectedFilter === "retard") return r.statut === "retard";
    return true;
  });

  const handleQuickPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || enteredAmount <= 0) {
      onShowToast("Veuillez sélectionner un membre et un montant valide.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await onRecordPayment({
        fiche_id: fiche.id,
        user_id: selectedUserId,
        montant: enteredAmount,
        mobile_provider: selectedProvider,
        note: `Encaissement rapide fiche ${fiche.code}`,
      });

      onShowToast(
        result.pending
          ? "Demande envoyée. En attente de la confirmation de l’opérateur."
          : result.payment.statut === "valide"
            ? `Paiement confirmé : ${formatMoney(result.allocation?.regle_fiche ?? enteredAmount)} soldés + ${formatMoney(result.allocation?.credite_solde ?? 0)} crédités.`
            : "Paiement refusé par la passerelle.",
      );
    } catch (err: any) {
      onShowToast(err.message || "Erreur lors de l'encaissement.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseCreditForUser = async (userId: string, dueAmount: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user || user.solde_credit <= 0) {
      onShowToast("Ce membre n'a aucun solde d'avance disponible.");
      return;
    }

    try {
      await onUseCredit(userId, fiche.id, Math.min(user.solde_credit, dueAmount));
      onShowToast(`Imputation automatique de l'avance crédit effectuée pour ${user.name} !`);
    } catch (err: any) {
      onShowToast(err.message || "Impossible d'imputer le crédit.");
    }
  };

  const handleExportReport = () => {
    onShowToast(`Rapport de cotisation pour "${fiche.titre}" exporté en PDF/CSV.`);
  };

  const handleRemindLate = async () => {
    try {
      const result = await mockApi.remindLateMembers(fiche.id);
      if (result.late === 0) {
        onShowToast("Aucun membre en retard sur cette fiche.");
        return;
      }
      const withoutEmail = result.without_email > 0 ? ` ${result.without_email} sans adresse e-mail n'ont pas pu être joints.` : "";
      onShowToast(`Rappel envoyé par e-mail à ${result.sent} retardataire(s).${withoutEmail}`);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible d'envoyer les rappels.");
    }
  };

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#777585]">
        <button type="button" onClick={onBack} className="flex items-center gap-1 hover:text-[#181c20] transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Fiches de cotisation</span>
        </button>
        <span>/</span>
        <span className="text-primary font-mono">{fiche.code}</span>
        <span>/</span>
        <span className="text-[#181c20] truncate">{fiche.titre}</span>
      </div>

      {/* Top Hero Section: Title, Subtitle, Gauge, Pills, Action Buttons */}
      <section className="bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-[#001943] bg-secondary-container px-3 py-1 rounded-full">
                {fiche.code}
              </span>
              <span className="text-xs font-semibold text-[#777585]">
                {fiche.group_id ? "Groupe A - Solidarité" : "Collecte libre"}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                En cours d'encaissement
              </span>
            </div>

            <h1 className="font-sora text-2xl sm:text-3xl text-[#181c20] font-bold tracking-tight">Fiche : {fiche.titre}</h1>
            <p className="hidden lg:block text-xs sm:text-sm text-[#464554] leading-relaxed">{fiche.motif}</p>
          </div>

          {/* Action Buttons (Right) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportReport}
              className="px-4 py-2.5 rounded-full bg-white hover:bg-[#eceef3] text-xs font-bold text-[#181c20] border border-[#e0e2e7] shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Exporter rapport</span>
            </button>

            <button
              type="button"
              onClick={handleRemindLate}
              className="px-4 py-2.5 rounded-full bg-[#f1f4f9] hover:bg-amber-100 text-xs font-bold text-[#181c20] border border-[#e0e2e7] shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">notifications_active</span>
              <span>Relancer les retardataires ({countRetard})</span>
            </button>
          </div>
        </div>

        {/* Middle Stats Bar with 79% Circular Gauge & Status Capsules */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 bg-[#f7f9fe] rounded-2xl border border-[#e6e8ed]">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* 79% Circular Gauge */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#e0e2e7]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="text-primary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${percentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="absolute font-sora text-sm font-bold text-[#181c20]">{percentage}%</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="font-sora text-2xl font-bold text-[#181c20]">{formatMoney(totalPaid)}</span>
                <span className="text-xs text-[#777585]">/ {formatMoney(totalImposed)} cible</span>
              </div>
              <span className="text-xs text-primary font-semibold">
                Reste à recouvrer : {formatMoney(totalImposed - totalPaid)}
              </span>
            </div>
          </div>

          {/* 3 Summary Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Payés : {countPaye} membres</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-amber-100/80 text-amber-900 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>Partiels : {countPartiel} membres</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-red-100/80 text-red-900 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>En retard : {countRetard} membres</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Left Members Table (8 cols) + Right Encaissement Rapide (4 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Members Table */}
        <div className="lg:col-span-8 bg-white rounded-[32px] p-6 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] flex flex-col gap-5">
          {/* Controls: Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-[#f1f4f9] p-1 rounded-full text-xs font-semibold text-[#464554]">
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1 rounded-full transition-all ${
                  selectedFilter === "all" ? "bg-[#181c20] text-white font-bold shadow-xs" : "hover:text-[#181c20]"
                }`}
              >
                Tous ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("paye")}
                className={`px-3 py-1 rounded-full transition-all ${
                  selectedFilter === "paye" ? "bg-[#181c20] text-white font-bold shadow-xs" : "hover:text-[#181c20]"
                }`}
              >
                À jour ({countPaye})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("partiel")}
                className={`px-3 py-1 rounded-full transition-all ${
                  selectedFilter === "partiel" ? "bg-[#181c20] text-white font-bold shadow-xs" : "hover:text-[#181c20]"
                }`}
              >
                Partiel ({countPartiel})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("retard")}
                className={`px-3 py-1 rounded-full transition-all ${
                  selectedFilter === "retard" ? "bg-[#181c20] text-white font-bold shadow-xs" : "hover:text-[#181c20]"
                }`}
              >
                En retard ({countRetard})
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#777585] text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#f7f9fe] border border-[#e0e2e7] rounded-full text-xs text-[#181c20] focus:outline-none focus:border-primary w-48 sm:w-56"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#eceef3] text-[#777585] uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-3">Membre</th>
                  <th className="py-3 px-2">Imposé</th>
                  <th className="py-3 px-2">Payé</th>
                  <th className="py-3 px-2">Reste</th>
                  <th className="py-3 px-3">Portefeuille Crédit</th>
                  <th className="py-3 px-2">Statut</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef3]/60">
                {filteredRecords.map((r) => {
                  const user = users.find((u) => u.id === r.user_id);
                  if (!user) return null;

                  const isAdvance = r.statut === "paye_avance";
                  const isLate = r.statut === "retard";
                  const isPartial = r.statut === "partiel";
                  const isPaid = r.statut === "paye";

                  return (
                    <tr key={r.user_id} className="hover:bg-[#f7f9fe] transition-colors group">
                      {/* Member Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar src={user.avatar} name={user.name} className="w-8 h-8" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-[#181c20]">{user.name}</span>
                            <span className="font-mono text-[10px] text-[#777585]">{user.member_number}</span>
                          </div>
                        </div>
                      </td>

                      {/* Imposé */}
                      <td className="py-3 px-2 font-mono font-medium text-[#464554]">{formatMoney(r.montant_impose)}</td>

                      {/* Payé */}
                      <td className="py-3 px-2 font-mono font-bold text-emerald-700">{formatMoney(r.montant_paye)}</td>

                      {/* Reste */}
                      <td className="py-3 px-2 font-mono font-bold">
                        {r.reste > 0 ? (
                          <span className={isLate ? "text-red-600" : "text-amber-700"}>{formatMoney(r.reste)}</span>
                        ) : (
                          <span className="text-emerald-700">{formatMoney(0)}</span>
                        )}
                      </td>

                      {/* Portefeuille Crédit */}
                      <td className="py-3 px-3">
                        {user.solde_credit > 0 ? (
                          <div className="inline-flex flex-col">
                            <span className="font-mono font-bold text-xs text-[#001943] bg-secondary-container/40 px-2 py-0.5 rounded-md">
                              +{formatMoney(user.solde_credit)}
                            </span>
                            <span className="text-[10px] text-[#3a5183] font-medium">
                              {Math.floor(user.solde_credit / imposedAmount)} mois d'avance
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#777585] text-[11px] font-mono">{formatMoney(0)}</span>
                        )}
                      </td>

                      {/* Statut Badge */}
                      <td className="py-3 px-2">
                        {isPaid && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 inline-block">
                            Payé
                          </span>
                        )}
                        {isAdvance && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary-container text-[#001943] inline-block">
                            Payé + Avance
                          </span>
                        )}
                        {isPartial && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 inline-block">
                            Partiel
                          </span>
                        )}
                        {isLate && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 inline-block">
                            En retard
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* If member has debt & has credit wallet -> One-click imputation */}
                          {r.reste > 0 && user.solde_credit > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUseCreditForUser(user.id, r.reste)}
                              className="px-2 py-1 bg-action hover:bg-action-hover text-white rounded-md text-[10px] font-bold transition-all shadow-xs"
                              title="Déduire du solde de crédit"
                            >
                              Imputer solde
                            </button>
                          )}

                          {/* Quick Select for right panel */}
                          {r.reste > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setAmountInput(String(r.reste));
                              }}
                              className="w-7 h-7 rounded-full bg-[#f1f4f9] hover:bg-[#181c20] hover:text-white flex items-center justify-center text-[#464554] transition-all"
                              title="Encaisser ce membre"
                            >
                              <span className="material-symbols-outlined text-[16px]">payments</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onShowToast(`Reçu numérique téléchargé pour ${user.name}`)}
                            className="w-7 h-7 rounded-full bg-[#f1f4f9] hover:bg-[#181c20] hover:text-white flex items-center justify-center text-[#464554] transition-all"
                            title="Télécharger reçu"
                          >
                            <span className="material-symbols-outlined text-[16px]">receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Encaissement Rapide with Live Automatic Ventilation */}
        <div className="lg:col-span-4 bg-white rounded-[32px] p-6 sm:p-7 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] sticky top-24 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#111418] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
            </div>
            <div>
              <h2 className="font-sora text-base font-bold text-[#181c20]">Encaissement rapide</h2>
              <p className="text-xs text-[#777585]">Ventilation automatique en cas de surplus</p>
            </div>
          </div>

          <form onSubmit={handleQuickPay} className="flex flex-col gap-4">
            {/* Member Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Sélectionnez le membre</label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  const rec = records.find((r) => r.user_id === e.target.value);
                  if (rec) {
                    setAmountInput(rec.reste > 0 ? String(rec.reste) : "25");
                  }
                }}
                className="w-full px-3 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-xs text-[#181c20] focus:outline-none focus:border-primary"
              >
                {users
                  .filter((u) => records.some((r) => r.user_id === u.id))
                  .map((u) => {
                    const rec = records.find((r) => r.user_id === u.id);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} (Reste : {formatMoney(rec ? rec.reste : 25)} | Portefeuille : {formatMoney(u.solde_credit)})
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Montant Reçu */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#181c20]">Montant encaissé ({currencySymbol()})</label>
                {selectedMemberRecord && (
                  <span className="text-[11px] text-[#777585]">
                    Reste dû : <strong>{formatMoney(selectedMemberRecord.reste)}</strong>
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                step="0.5"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-3 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm font-bold text-[#181c20] focus:outline-none focus:border-primary"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAmountInput(String(currentDue))}
                  className="px-2.5 py-1 rounded-md bg-[#f1f4f9] hover:bg-[#eceef3] text-[11px] font-bold text-[#464554]"
                >
                  Exact ({formatMoney(currentDue)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmountInput(String(currentDue + imposedAmount))}
                  className="px-2.5 py-1 rounded-md bg-secondary-container/30 hover:bg-secondary-container/50 text-[11px] font-bold text-[#001943]"
                >
                  +1 mois ({formatMoney(currentDue + imposedAmount)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmountInput(String(currentDue + imposedAmount * 2))}
                  className="px-2.5 py-1 rounded-md bg-secondary-container/30 hover:bg-secondary-container/50 text-[11px] font-bold text-[#001943]"
                >
                  +2 mois ({formatMoney(currentDue + imposedAmount * 2)})
                </button>
              </div>
            </div>

            {/* LIVE AUTOMATIC VENTILATION CARD */}
            <div className="p-3.5 bg-[#f1f4f9] rounded-2xl border border-[#e0e2e7] flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#3a5183] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                Ventilation automatique du paiement
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#464554]">Règlement cotisation en cours :</span>
                <span className="font-mono font-bold text-[#181c20]">{formatMoney(regleFiche)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#464554]">Crédité au portefeuille d'avance :</span>
                <span className={`font-mono font-bold ${crediteSolde > 0 ? "text-primary" : "text-[#777585]"}`}>
                  +{formatMoney(crediteSolde)}
                </span>
              </div>

              {crediteSolde > 0 && (
                <div className="text-[10px] text-primary font-semibold bg-[#e2dfff]/60 px-2 py-1 rounded-md mt-1">
                  Ce surplus sera automatiquement déduit des prochaines cotisations de{" "}
                  {selectedMemberUser?.name.split(" ")[0]}.
                </div>
              )}
            </div>

            <MobileMoneyProviderSelect
              value={selectedProvider}
              onChange={setSelectedProvider}
              label="Réseau de paiement"
              providers={["orange_money", "mpesa", "airtel_money", "wave", "mtn_momo", "cash_guichet"]}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full mt-1 py-3 px-4 rounded-full bg-action hover:bg-action-hover text-white font-sora font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{isProcessing ? "Validation..." : `Valider l'encaissement (${formatMoney(enteredAmount)})`}</span>
            </button>
          </form>
        </div>
      </section>

      {/* Bottom KPI Capsules: Solde Global Portefeuilles & Pénalités */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#eceef3] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-secondary-container text-[#001943] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">savings</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#777585]">Solde Global Portefeuilles (Avances Groupe)</span>
              <span className="font-sora text-2xl font-bold text-[#181c20]">+{formatMoney(totalCreditAdvances)}</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary-container/40 text-[#001943]">
            Disponible pour futures fiches
          </span>
        </div>

        <div className="bg-white p-6 rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#eceef3] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#f1f4f9] text-[#464554] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">gavel</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#777585]">Pénalités de retard accumulées</span>
              <span className="font-sora text-2xl font-bold text-[#181c20]">{formatMoney(0)}</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
            Aucune pénalité active
          </span>
        </div>
      </section>
    </div>
  );
};
