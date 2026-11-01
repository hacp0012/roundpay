import React, { useState } from "react";
import { FicheContribution, MobileMoneyProvider, PaymentRecordResult } from "../../types";
import { MobileMoneyBadge } from "../../components/common/MobileMoneyBadges";
import { MobileMoneyProviderSelect } from "../../components/common/MobileMoneyProviderSelect";
import { Modal } from "../../components/modals/Modal";
import { Button, Checkbox, Input, Label, Spinner } from "../../components/ui";
import { formatMoney, currencySymbol } from "../../config/currency";

interface PublicDonationModalProps {
  isOpen: boolean;
  fiche: FicheContribution | null;
  onClose: () => void;
  onConfirmDonation: (payload: {
    fiche_id: string;
    montant: number;
    mobile_provider: MobileMoneyProvider;
    nom_donateur_libre?: string;
    phone_number?: string;
    is_anonymous: boolean;
  }) => Promise<PaymentRecordResult>;
  onShowToast: (msg: string) => void;
}

export const PublicDonationModal: React.FC<PublicDonationModalProps> = ({
  isOpen,
  fiche,
  onClose,
  onConfirmDonation,
  onShowToast,
}) => {
  const [amountOption, setAmountOption] = useState<"preset" | "custom">("preset");
  const [selectedAmount, setSelectedAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>("20");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider>("orange_money");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    reference: string;
    amount: number;
    date: string;
    statut: "valide" | "en_attente" | "echoue";
  } | null>(null);

  const finalAmount = amountOption === "preset" ? selectedAmount : parseFloat(customAmount) || 0;

  const handleClose = () => {
    setSuccessReceipt(null);
    setIsAnonymous(false);
    setDonorName("");
    setDonorPhone("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiche) return;
    if (finalAmount <= 0) {
      onShowToast("Veuillez spécifier un montant valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onConfirmDonation({
        fiche_id: fiche.id,
        montant: finalAmount,
        mobile_provider: selectedProvider,
        nom_donateur_libre: isAnonymous ? "Donateur Anonyme" : donorName.trim() || "Bienfaiteur anonyme",
        phone_number: donorPhone.trim() || undefined,
        is_anonymous: isAnonymous,
      });

      setSuccessReceipt({
        reference: result.payment.reference,
        amount: result.payment.montant,
        date: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        statut: result.payment.statut,
      });
      onShowToast(
        result.pending
          ? "Demande envoyée. Validez le push Mobile Money sur votre téléphone."
          : result.payment.statut === "valide"
            ? `Don confirmé : ${formatMoney(result.payment.montant)}.`
            : "Le paiement a été refusé.",
      );
    } catch (err: any) {
      onShowToast(err.message || "Échec de l'enregistrement de la contribution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen && !!fiche}
      onClose={handleClose}
      modalId="public-donation"
      panelClassName="bg-white w-full max-w-lg rounded-[28px] p-5 sm:p-6 shadow-2xl border border-[#eceef3] relative my-auto"
    >
      {fiche && (
        <>
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 rounded-full text-[#777585] hover:text-[#181c20] hover:bg-[#f1f4f9] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {successReceipt ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${successReceipt.statut === "valide" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-700"}`}
              >
                <span className="material-symbols-outlined text-[36px]">
                  {successReceipt.statut === "valide" ? "check_circle" : "schedule"}
                </span>
              </div>

              <div>
                <h2 className="font-sora text-xl font-bold text-[#181c20]">
                  {successReceipt.statut === "valide" ? "Contribution confirmée" : "Demande de paiement en attente"}
                </h2>
                <p className="hidden lg:block text-xs text-[#777585] mt-1">
                  {successReceipt.statut === "valide"
                    ? "Votre versement a été confirmé et crédité sur la fiche solidaire."
                    : "Validez le push Mobile Money sur votre téléphone. La contribution sera comptabilisée après confirmation de l’opérateur."}
                </p>
              </div>

              <div className="w-full bg-[#f7f9fe] p-4 rounded-2xl border border-[#eceef3] text-left text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[#777585]">Fiche :</span>
                  <span className="font-bold text-[#181c20]">{fiche.titre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777585]">Montant versé :</span>
                  <span className="font-mono font-bold text-base text-emerald-700">{formatMoney(successReceipt.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777585]">Réf. Transaction :</span>
                  <span className="font-mono text-[11px] font-bold text-primary">{successReceipt.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777585]">Mode :</span>
                  <MobileMoneyBadge provider={selectedProvider} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777585]">Contributeur :</span>
                  <span className="font-semibold text-[#181c20]">
                    {isAnonymous ? "Donateur Anonyme" : donorName || "Bienfaiteur anonyme"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-[#777585] pt-1 border-t border-[#eceef3]">
                  <span>Date & heure :</span>
                  <span>{successReceipt.date}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 rounded-full border border-[#e0e2e7] hover:bg-[#f7f9fe] text-xs font-bold text-[#464554] flex items-center justify-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Imprimer reçu</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-full bg-action hover:bg-action-hover text-white text-xs font-bold transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {fiche.code}
                  </span>
                  <span className="hidden lg:inline text-xs text-[#777585]">Contribution publique directe</span>
                </div>
                <h2 className="font-sora text-xl font-bold text-[#181c20] mt-1 pr-8">{fiche.titre}</h2>
                <p className="hidden lg:block text-xs text-[#464554] mt-1 line-clamp-2">{fiche.motif}</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#181c20]">Choisissez votre montant</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAmountOption("preset");
                        setSelectedAmount(amt);
                      }}
                      className={`py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                        amountOption === "preset" && selectedAmount === amt
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white border-[#e0e2e7] text-[#181c20] hover:border-secondary-container"
                      }`}
                    >
                      {formatMoney(amt)}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    placeholder="Autre montant..."
                    value={amountOption === "custom" ? customAmount : ""}
                    onChange={(e) => {
                      setAmountOption("custom");
                      setCustomAmount(e.target.value);
                    }}
                    onFocus={() => setAmountOption("custom")}
                    className={`flex-1 px-3.5 py-2 text-xs rounded-xl border bg-white text-[#181c20] focus:outline-none transition-all ${
                      amountOption === "custom" ? "border-primary ring-1 ring-primary" : "border-[#e0e2e7]"
                    }`}
                  />
                  <span className="text-xs font-bold text-[#777585]">{currencySymbol()}</span>
                </div>
              </div>

              <MobileMoneyProviderSelect value={selectedProvider} onChange={setSelectedProvider} label="Réseau de paiement" />

              <div className="flex flex-col gap-3 p-3.5 bg-[#f7f9fe] rounded-2xl border border-[#eceef3]">
                <Checkbox
                  label="Garder mon don anonyme sur la fiche publique"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />

                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <Label className="text-[10px] font-bold text-[#777585] mb-1">Votre Nom ou Prénom</Label>
                      <Input
                        type="text"
                        placeholder="Ex: David, Amina K."
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-[#777585] mb-1">N° Téléphone (Reçu SMS)</Label>
                      <Input
                        type="tel"
                        placeholder="Ex: +33 6... ou +243..."
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting || finalAmount <= 0} size="lg" className="w-full shadow-md">
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="border-white/40 border-t-white" />
                    <span>Traitement Mobile Money...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
                    <span>Confirmer ma contribution de {formatMoney(finalAmount)}</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </>
      )}
    </Modal>
  );
};
