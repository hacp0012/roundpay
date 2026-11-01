import React, { useState } from "react";
import { User, FicheContribution, MemberFicheRecord, Payment, PaymentRecordResult, MobileMoneyProvider } from "../../types";
import { RoundPayLogo } from "../common/RoundPayLogo";
import { PROVIDERS_CONFIG } from "../common/MobileMoneyBadges";
import { MobileMoneyProviderSelect } from "../common/MobileMoneyProviderSelect";
import { Modal } from "../modals/Modal";
import { APP_NAME } from "../../config/branding";
import { Button, Checkbox, Input, Radio } from "../ui";
import { formatMoney, currencySymbol } from "../../config/currency";

interface ContributorMobileViewProps {
  currentUser: User;
  users?: User[];
  fiches: FicheContribution[];
  records: Record<string, MemberFicheRecord[]>;
  payments: Payment[];
  onRecordPayment: (payload: {
    fiche_id: string;
    user_id: string | null;
    nom_donateur_libre?: string;
    is_anonymous?: boolean;
    montant: number;
    mobile_provider: MobileMoneyProvider;
    phone_number?: string;
    note?: string;
  }) => Promise<PaymentRecordResult>;
  onUseCredit: (user_id: string, fiche_id: string, amount: number) => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const ContributorMobileView: React.FC<ContributorMobileViewProps> = ({
  currentUser,
  fiches,
  records,
  payments,
  onRecordPayment,
  onUseCredit,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<"obligatoires" | "libres" | "historique">("obligatoires");

  // Explanatory presentation modal for a fiche
  const [explanatoryFiche, setExplanatoryFiche] = useState<FicheContribution | null>(null);

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [targetFiche, setTargetFiche] = useState<FicheContribution | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider>("orange_money");
  const [paymentPhone, setPaymentPhone] = useState(currentUser.phone);
  const [amountOption, setAmountOption] = useState<"exact" | "plus1" | "plus2" | "custom">("exact");
  const [customAmount, setCustomAmount] = useState("25");
  const [isAnonymousDonation, setIsAnonymousDonation] = useState(false);
  const [isSimulatingUSSD, setIsSimulatingUSSD] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    reference: string;
    amount: number;
    ficheTitre: string;
    surplus: number;
    statut: Payment["statut"];
  } | null>(null);

  // Filter fiches for the contributor
  const userFiches = fiches.filter((f) => {
    if (f.type === "libre") return false;
    return f.group_id && currentUser.group_ids.includes(f.group_id);
  });

  const libreFiches = fiches.filter((f) => f.type === "libre");

  const userPayments = payments.filter((p) => p.user_id === currentUser.id);

  // Target fiche record for current user
  const targetRecord = targetFiche ? records[targetFiche.id]?.find((r) => r.user_id === currentUser.id) : null;
  const currentDue = targetRecord ? targetRecord.reste : targetFiche?.montant_impose || 25;
  const baseDue = targetFiche?.montant_impose || 25;

  // Compute calculated amount to charge
  let calculatedAmount = currentDue;
  if (targetFiche?.type === "libre") {
    calculatedAmount = parseFloat(customAmount) || 50;
  } else if (amountOption === "exact") {
    calculatedAmount = currentDue;
  } else if (amountOption === "plus1") {
    calculatedAmount = currentDue + baseDue;
  } else if (amountOption === "plus2") {
    calculatedAmount = currentDue + baseDue * 2;
  } else if (amountOption === "custom") {
    calculatedAmount = parseFloat(customAmount) || currentDue;
  }

  const surplusCredited = targetFiche?.type === "obligatoire" ? Math.max(0, calculatedAmount - currentDue) : 0;

  const handleOpenPayment = (fiche: FicheContribution) => {
    setTargetFiche(fiche);
    const rec = records[fiche.id]?.find((r) => r.user_id === currentUser.id);
    const due = rec ? rec.reste : fiche.montant_impose || 25;
    setCustomAmount(String(due > 0 ? due : 25));
    setAmountOption("exact");
    setPaymentSuccessData(null);
    setIsSimulatingUSSD(false);
    setIsPaymentOpen(true);
  };

  const handleClosePayment = () => {
    setIsPaymentOpen(false);
    setPaymentSuccessData(null);
    setIsSimulatingUSSD(false);
  };

  const handleConfirmMobilePayment = async () => {
    if (!targetFiche || calculatedAmount <= 0) return;

    setIsSimulatingUSSD(true);
    try {
      const result = await onRecordPayment({
        fiche_id: targetFiche.id,
        user_id: isAnonymousDonation ? null : currentUser.id,
        nom_donateur_libre: isAnonymousDonation ? "Donateur Anonyme" : currentUser.name,
        is_anonymous: isAnonymousDonation,
        montant: calculatedAmount,
        mobile_provider: selectedProvider,
        phone_number: paymentPhone,
        note: `Paiement mobile ${PROVIDERS_CONFIG[selectedProvider].name}`,
      });

      setPaymentSuccessData({
        reference: result.payment.reference,
        amount: result.payment.montant,
        ficheTitre: targetFiche.titre,
        surplus: result.allocation?.credite_solde || 0,
        statut: result.payment.statut,
      });
      onShowToast(
        result.pending
          ? "Demande envoyée. Validez le push Mobile Money sur votre téléphone."
          : result.payment.statut === "valide"
            ? "Paiement confirmé par l’opérateur."
            : "Paiement refusé.",
      );
    } catch (err: any) {
      onShowToast(err.message || "Échec de la transaction.");
    } finally {
      setIsSimulatingUSSD(false);
    }
  };

  const handlePayUsingAvailableCredit = async (fiche: FicheContribution, due: number) => {
    if (currentUser.solde_credit <= 0) {
      onShowToast("Votre solde d'avance est insuffisant.");
      return;
    }

    try {
      const amountToUse = Math.min(currentUser.solde_credit, due);
      await onUseCredit(currentUser.id, fiche.id, amountToUse);
      onShowToast(`Cotisation réglée via votre solde d'avance (-${formatMoney(amountToUse)}) !`);
    } catch (err: any) {
      onShowToast(err.message || "Erreur lors de l'imputation.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-20">
      {/* User Greeting & Status Alert */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777585]">ESPACE MEMBRE · MOBILE</span>
          <h1 className="font-sora text-xl font-bold text-[#181c20]">Salut, {currentUser.name} 👋</h1>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white text-[#464554] border border-[#e0e2e7] shadow-xs">
          {currentUser.member_number}
        </span>
      </div>

      {/* Hero Card: Mon Portefeuille Crédit / Solde d'avance */}
      <div className="bg-secondary-container text-[#001943] rounded-[28px] p-5 shadow-[0_12px_28px_-8px_rgb(var(--app-color-rgb)/0.15)] flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2e4676]">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span>Mon Portefeuille d'Avance</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-bold text-[#001943]">{APP_NAME} Solde</span>
        </div>

        <div className="my-3 relative z-10">
          <span className="font-sora text-3xl sm:text-4xl font-bold tracking-tight">
            +{formatMoney(currentUser.solde_credit)}
          </span>
          <p className="text-xs text-[#3a5183] mt-1 leading-tight">
            {currentUser.solde_credit > 0
              ? "Ce solde couvrira automatiquement vos prochaines cotisations obligatoires."
              : "Vous n'avez pas d'avance de cotisation. Vous pouvez payer en avance à tout moment."}
          </p>
        </div>

        <div className="pt-2 border-t border-[#3a5183]/20 flex items-center justify-between text-xs relative z-10">
          <span className="text-[#2e4676] font-medium">{Math.floor(currentUser.solde_credit / 25)} mois d'avance actif</span>
          <button
            type="button"
            onClick={() => {
              if (userFiches[0]) handleOpenPayment(userFiches[0]);
            }}
            className="px-3 py-1 rounded-full bg-action hover:bg-action-hover text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span>Recharger</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher Pills */}
      <div className="grid grid-cols-3 gap-1 bg-[#eceef3] p-1 rounded-full text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("obligatoires")}
          className={`py-2 px-2 rounded-full transition-all text-center truncate ${
            activeTab === "obligatoires"
              ? "bg-[#111418] text-white shadow-xs font-bold"
              : "text-[#464554] hover:text-[#181c20]"
          }`}
        >
          À payer ({userFiches.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("libres")}
          className={`py-2 px-2 rounded-full transition-all text-center truncate ${
            activeTab === "libres" ? "bg-[#111418] text-white shadow-xs font-bold" : "text-[#464554] hover:text-[#181c20]"
          }`}
        >
          Cagnottes &amp; Dons
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("historique")}
          className={`py-2 px-2 rounded-full transition-all text-center truncate ${
            activeTab === "historique" ? "bg-[#111418] text-white shadow-xs font-bold" : "text-[#464554] hover:text-[#181c20]"
          }`}
        >
          Mes Reçus
        </button>
      </div>

      {/* TAB 1: Mes Cotisations Obligatoires */}
      {activeTab === "obligatoires" && (
        <div className="flex flex-col gap-3">
          {userFiches.map((fiche) => {
            const record = records[fiche.id]?.find((r) => r.user_id === currentUser.id);
            const imposed = fiche.montant_impose || 25;
            const paid = record ? record.montant_paye : 0;
            const reste = record ? record.reste : imposed;
            const isPaid = reste === 0;
            const isLate = record?.statut === "retard";

            return (
              <div
                key={fiche.id}
                className={`bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border transition-all flex flex-col gap-3 ${
                  isLate ? "border-red-200" : isPaid ? "border-emerald-200" : "border-[#eceef3]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {fiche.code}
                      </span>
                      <span className="text-[11px] text-[#777585]">Groupe A</span>
                    </div>
                    <h2 className="font-sora text-sm font-bold text-[#181c20] mt-1 flex items-center gap-1">
                      <span>{fiche.titre}</span>
                      <button
                        type="button"
                        onClick={() => setExplanatoryFiche(fiche)}
                        className="hidden lg:inline-flex text-[#777585] hover:text-primary transition-colors"
                        title="Lire l'explication"
                      >
                        <span className="material-symbols-outlined text-[15px]">info</span>
                      </button>
                    </h2>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : isLate
                          ? "bg-red-100 text-red-800 animate-pulse"
                          : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {isPaid ? "Payé" : isLate ? "En retard !" : "À payer"}
                  </span>
                </div>

                {/* Explanatory Teaser Button */}
                <button
                  type="button"
                  onClick={() => setExplanatoryFiche(fiche)}
                  className="hidden lg:flex text-left text-[11px] text-[#464554] bg-[#f7f9fe] hover:bg-[#f1f4f9] p-2.5 rounded-xl border border-[#eceef3] transition-colors items-center justify-between"
                >
                  <span className="line-clamp-1 italic">{fiche.description || fiche.motif}</span>
                  <span className="text-[10px] font-bold text-primary shrink-0 ml-2">Lire l'explication &rarr;</span>
                </button>

                {/* Financial amounts row */}
                <div className="bg-[#f7f9fe] p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[#777585] text-[10px]">Montant imposé</span>
                    <span className="font-mono font-bold text-[#181c20]">{formatMoney(imposed)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#777585] text-[10px]">Déjà payé</span>
                    <span className="font-mono font-bold text-emerald-700">{formatMoney(paid)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[#777585] text-[10px]">Reste dû</span>
                    <span className={`font-mono font-bold text-sm ${reste > 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {formatMoney(reste)}
                    </span>
                  </div>
                </div>

                {/* Actions for this sheet */}
                {reste > 0 ? (
                  <div className="flex flex-col gap-2 pt-1">
                    {/* One click credit resolution if user has credit */}
                    {currentUser.solde_credit > 0 && (
                      <button
                        type="button"
                        onClick={() => handlePayUsingAvailableCredit(fiche, reste)}
                        className="w-full py-2 px-3 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">savings</span>
                        <span>Régler avec mon solde ({formatMoney(Math.min(currentUser.solde_credit, reste))})</span>
                      </button>
                    )}

                    {/* Pay with Mobile Money */}
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(fiche)}
                      className="w-full py-2.5 px-4 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      <span>Payer via Mobile Money ({formatMoney(reste)})</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold pt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Cotisation en règle
                    </span>
                    <button
                      type="button"
                      onClick={() => onShowToast(`Reçu officiel téléchargé pour ${fiche.code}`)}
                      className="text-primary hover:underline font-bold text-[11px]"
                    >
                      Télécharger reçu
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Cagnottes Libres & Dons */}
      {activeTab === "libres" && (
        <div className="flex flex-col gap-3">
          {libreFiches.map((fiche) => (
            <div
              key={fiche.id}
              className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#eceef3] flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-[#001943] text-[10px] font-bold">
                    Collecte Ouverte à Tous
                  </span>
                  <h2 className="font-sora text-sm font-bold text-[#181c20] mt-1.5">{fiche.titre}</h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary-container/30 flex items-center justify-center text-[#475e90]">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                </div>
              </div>

              <p className="hidden lg:block text-xs text-[#464554] leading-relaxed">{fiche.motif}</p>

              {/* Explanatory Button for Libre Fiche */}
              <button
                type="button"
                onClick={() => setExplanatoryFiche(fiche)}
                className="hidden lg:flex text-left text-[11px] text-[#464554] bg-[#f7f9fe] hover:bg-[#f1f4f9] p-2.5 rounded-xl border border-[#eceef3] transition-colors items-center justify-between"
              >
                <span className="line-clamp-1 italic">
                  {fiche.description || "Comprendre la raison de cette collecte solidaire"}
                </span>
                <span className="text-[10px] font-bold text-primary shrink-0 ml-2">Lire l'explication &rarr;</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#777585]">
                  Objectif : <strong>{formatMoney(fiche.cagnotte_cible || 0)}</strong>
                </span>
                <span className="text-emerald-700 font-bold">Dons libres acceptés</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenPayment(fiche)}
                className="w-full mt-1 py-2.5 px-4 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
                <span>Faire un don par Mobile Money</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Historique des paiements & Reçus */}
      {activeTab === "historique" && (
        <div className="flex flex-col gap-3">
          <h2 className="font-sora text-xs font-bold text-[#777585] uppercase tracking-wider">Mes versements récents</h2>

          {userPayments.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl text-center text-xs text-[#777585]">
              Aucun versement enregistré pour ce profil.
            </div>
          ) : (
            userPayments.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-2xl border border-[#eceef3] flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${p.statut === "valide" ? "bg-emerald-50 text-emerald-600" : p.statut === "en_attente" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {p.statut === "valide" ? "verified" : p.statut === "en_attente" ? "schedule" : "error"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-[#181c20]">{p.fiche_titre || "Paiement cotisation"}</span>
                    <span className="text-[10px] text-[#777585]">
                      {p.date} · Ref: {p.reference}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${p.statut === "valide" ? "text-emerald-700" : p.statut === "en_attente" ? "text-amber-700" : "text-red-600"}`}
                    >
                      {p.statut === "valide" ? "Confirmé" : p.statut === "en_attente" ? "En attente" : "Échoué"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`font-sora font-bold text-xs ${p.statut === "valide" ? "text-emerald-700" : p.statut === "en_attente" ? "text-amber-700" : "text-red-600"}`}
                  >
                    +{formatMoney(p.montant)}
                  </span>
                  {p.statut === "valide" && (
                    <button
                      type="button"
                      onClick={() => onShowToast(`Reçu ${p.reference} téléchargé.`)}
                      className="text-[10px] text-primary font-bold hover:underline mt-0.5"
                    >
                      Reçu PDF
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MOBILE MONEY PAYMENT DRAWER / MODAL */}
      <Modal
        isOpen={isPaymentOpen && !!targetFiche}
        onClose={handleClosePayment}
        modalId="member-payment"
        overlayClassName="items-end sm:items-center justify-center p-0 sm:p-4"
        panelClassName="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        {targetFiche && (
          <>
            <div className="flex items-center justify-between border-b border-[#eceef3] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#111418] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">smartphone</span>
                </div>
                <div>
                  <h2 className="font-sora text-sm font-bold text-[#181c20]">Paiement Mobile Money</h2>
                  <span className="text-[11px] text-[#777585] line-clamp-1">{targetFiche.titre}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePayment}
                className="w-7 h-7 rounded-full bg-[#f1f4f9] text-[#777585] flex items-center justify-center hover:bg-[#eceef3]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {paymentSuccessData ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${paymentSuccessData.statut === "valide" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-700"}`}
                >
                  <span className="material-symbols-outlined text-[32px]">
                    {paymentSuccessData.statut === "valide" ? "check_circle" : "schedule"}
                  </span>
                </div>
                <h3 className="font-sora text-lg font-bold text-[#181c20]">
                  {paymentSuccessData.statut === "valide" ? "Paiement confirmé" : "Demande en attente"}
                </h3>
                <p className="hidden lg:block text-xs text-[#464554]">
                  {paymentSuccessData.statut === "valide" ? (
                    <>
                      Votre paiement de <strong className="text-[#181c20]">{formatMoney(paymentSuccessData.amount)}</strong>{" "}
                      est confirmé.
                    </>
                  ) : (
                    <>
                      Validez la demande Mobile Money sur votre téléphone. La cotisation ne sera comptabilisée qu’après
                      confirmation de l’opérateur.
                    </>
                  )}
                </p>

                <div className="w-full bg-[#f7f9fe] p-3.5 rounded-2xl border border-[#e0e2e7] flex flex-col gap-1.5 text-xs text-left">
                  <div className="flex justify-between">
                    <span className="text-[#777585]">Référence :</span>
                    <span className="font-mono font-bold text-[#181c20]">{paymentSuccessData.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777585]">Opérateur :</span>
                    <span className="font-bold text-[#181c20]">{PROVIDERS_CONFIG[selectedProvider].name}</span>
                  </div>
                  {paymentSuccessData.surplus > 0 && (
                    <div className="flex justify-between text-primary font-bold">
                      <span>Crédité au solde d'avance :</span>
                      <span>+{formatMoney(paymentSuccessData.surplus)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleClosePayment}
                  className="w-full mt-2 py-3 px-4 rounded-full bg-[#111418] text-white font-sora font-bold text-xs shadow-md hover:bg-action-hover"
                >
                  Terminer
                </button>
              </div>
            ) : isSimulatingUSSD ? (
              /* USSD Push Notification Simulation */
              <div className="flex flex-col items-center text-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-secondary-container/40 text-primary flex items-center justify-center animate-bounce">
                  <span className="material-symbols-outlined text-[32px]">send_to_mobile</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-sora text-base font-bold text-[#181c20]">Demande envoyée sur votre téléphone</h3>
                  <p className="hidden lg:block text-xs text-[#777585]">
                    Veuillez saisir votre code secret PIN <strong>{PROVIDERS_CONFIG[selectedProvider].name}</strong> pour
                    approuver le débit de <strong>{formatMoney(calculatedAmount)}</strong>.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                  Attente de la confirmation réseau...
                </span>
              </div>
            ) : (
              /* Form to choose provider, amount, phone */
              <div className="flex flex-col gap-4">
                <MobileMoneyProviderSelect
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                  label="Réseau de paiement"
                  providers={["orange_money", "mpesa", "airtel_money", "wave", "mtn_momo"]}
                />

                {/* 2. Amount Options (Exact vs 1 month advance vs 2 months advance) */}
                {targetFiche.type === "obligatoire" ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#181c20]">Montant du versement</label>
                    <div className="flex flex-col gap-2">
                      {/* Option A: Exact due */}
                      <label
                        onClick={() => setAmountOption("exact")}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs ${
                          amountOption === "exact" ? "border-primary bg-[#f7f9fe]" : "border-[#e0e2e7]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Radio checked={amountOption === "exact"} onChange={() => setAmountOption("exact")} />
                          <span>Régler l'échéance exacte</span>
                        </div>
                        <span className="font-mono font-bold text-[#181c20]">{formatMoney(currentDue)}</span>
                      </label>

                      {/* Option B: 1 month advance */}
                      <label
                        onClick={() => setAmountOption("plus1")}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs ${
                          amountOption === "plus1" ? "border-primary bg-secondary-container/20" : "border-[#e0e2e7]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Radio checked={amountOption === "plus1"} onChange={() => setAmountOption("plus1")} />
                          <span>Échéance + 1 mois d'avance</span>
                        </div>
                        <span className="font-mono font-bold text-primary">{formatMoney(currentDue + baseDue)}</span>
                      </label>

                      {/* Option C: 2 months advance */}
                      <label
                        onClick={() => setAmountOption("plus2")}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs ${
                          amountOption === "plus2" ? "border-primary bg-secondary-container/20" : "border-[#e0e2e7]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Radio checked={amountOption === "plus2"} onChange={() => setAmountOption("plus2")} />
                          <span>Échéance + 2 mois d'avance</span>
                        </div>
                        <span className="font-mono font-bold text-primary">{formatMoney(currentDue + baseDue * 2)}</span>
                      </label>
                    </div>

                    {surplusCredited > 0 && (
                      <div className="p-2.5 bg-secondary-container/30 rounded-xl text-xs text-[#001943] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">info</span>
                        <span>
                          {formatMoney(currentDue)} pour ce mois + <strong>+{formatMoney(surplusCredited)}</strong> crédité
                          sur votre portefeuille d'avance.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Free Donation Amount */
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#181c20]">Montant de votre don ({currencySymbol()})</label>
                    <Input
                      type="number"
                      min="5"
                      step="5"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="px-3 py-2 text-sm font-bold"
                    />

                    <Checkbox
                      label="Faire ce don de façon anonyme"
                      checked={isAnonymousDonation}
                      onChange={(e) => setIsAnonymousDonation(e.target.checked)}
                    />
                  </div>
                )}

                {/* 3. Mobile Number Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#181c20]">Numéro de téléphone Mobile Money</label>
                  <Input
                    type="tel"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    className="px-3.5 py-2 font-mono"
                  />
                </div>

                {/* Confirm Button */}
                <Button type="button" onClick={handleConfirmMobilePayment} size="lg" className="w-full mt-2 shadow-md">
                  <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
                  <span>
                    Payer {formatMoney(calculatedAmount)} via {PROVIDERS_CONFIG[selectedProvider].shortName}
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Explanatory Presentation Modal for Fiches */}
      <Modal
        isOpen={!!explanatoryFiche}
        onClose={() => setExplanatoryFiche(null)}
        modalId="fiche-explanation"
        overlayClassName="items-end sm:items-center justify-center p-0 sm:p-4"
        panelClassName="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-[#eceef3] max-h-[85vh] overflow-y-auto flex flex-col gap-4"
      >
        {explanatoryFiche && (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-[#eceef3]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {explanatoryFiche.code}
                </span>
                <span className="text-xs text-[#777585]">
                  {explanatoryFiche.type === "libre" ? "Collecte Ouverte" : "Cotisation Membre"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExplanatoryFiche(null)}
                className="p-1 rounded-full text-[#777585] hover:text-[#181c20]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div>
              <h3 className="font-sora text-base font-bold text-[#181c20]">{explanatoryFiche.titre}</h3>
              <p className="text-xs text-[#777585] mt-0.5">{explanatoryFiche.motif}</p>
            </div>

            {/* Complete Explicative Presentation */}
            <div className="p-4 rounded-2xl bg-[#f7f9fe] border border-[#eceef3] flex flex-col gap-2">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Raison de votre contribution & Présentation du besoin :
              </span>
              <p className="text-xs text-[#181c20] leading-relaxed">
                {explanatoryFiche.description ||
                  "Cette cotisation collective a été votée et validée pour répondre à une dépense d'intérêt général pour le collectif. Chaque membre contribue à hauteur de son engagement afin d'assurer l'équilibre financier et l'entraide mutuelle."}
              </p>

              {explanatoryFiche.beneficiaire && (
                <div className="mt-2 pt-2 border-t border-[#e0e2e7] flex items-center justify-between text-[11px]">
                  <span className="text-[#777585]">Bénéficiaire :</span>
                  <span className="font-bold text-[#181c20]">{explanatoryFiche.beneficiaire}</span>
                </div>
              )}
            </div>

            {/* Financial State for Member */}
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#f1f4f9]">
              <span className="text-[#777585]">
                {explanatoryFiche.type === "libre"
                  ? `Objectif de la cagnotte : ${formatMoney(explanatoryFiche.cagnotte_cible || 1000)}`
                  : `Cotisation obligatoire : ${formatMoney(explanatoryFiche.montant_impose || 25)}`}
              </span>
              <span className="font-bold text-emerald-700">100% traçable</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const ficheToPay = explanatoryFiche;
                  setExplanatoryFiche(null);
                  handleOpenPayment(ficheToPay);
                }}
                className="w-full py-3 px-4 rounded-full bg-action hover:bg-action-hover text-white font-sora font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {explanatoryFiche.type === "libre" ? "volunteer_activism" : "payments"}
                </span>
                <span>
                  {explanatoryFiche.type === "libre"
                    ? "Faire un don Mobile Money"
                    : "Régler cette cotisation par Mobile Money"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExplanatoryFiche(null)}
                className="w-full py-2.5 px-4 rounded-full border border-[#e0e2e7] text-xs font-semibold text-[#777585] hover:bg-[#f7f9fe]"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
