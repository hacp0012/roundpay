import React, { useState } from "react";
import { User, FicheContribution, MemberFicheRecord, MobileMoneyProvider, PaymentRecordResult } from "../../types";
import { Modal } from "./Modal";
import { MobileMoneyProviderSelect } from "../common/MobileMoneyProviderSelect";
import { Button, Checkbox, IconButton, Input, Label, Select } from "../ui";
import { formatMoney, currencySymbol } from "../../config/currency";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiches: FicheContribution[];
  users: User[];
  records: Record<string, MemberFicheRecord[]>;
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
  onShowToast: (msg: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  fiches,
  users,
  records,
  onRecordPayment,
  onShowToast,
}) => {
  const [selectedFicheId, setSelectedFicheId] = useState<string>(fiches[0]?.id || "fiche-1");
  const [selectedUserId, setSelectedUserId] = useState<string>(users[1]?.id || "");
  const [nomDonateur, setNomDonateur] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(users[1]?.phone || "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [montant, setMontant] = useState("25");
  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider>("orange_money");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFiche = fiches.find((f) => f.id === selectedFicheId);
  const isFreeCollection = selectedFiche?.type === "libre";

  const userRecord =
    selectedFiche && !isFreeCollection ? records[selectedFiche.id]?.find((r) => r.user_id === selectedUserId) : null;
  const currentDue = userRecord ? userRecord.reste : selectedFiche?.montant_impose || 25;
  const enteredAmount = parseFloat(montant) || 0;

  const regleFiche = Math.min(enteredAmount, currentDue);
  const crediteSolde = !isFreeCollection ? Math.max(0, enteredAmount - currentDue) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredAmount <= 0) {
      onShowToast("Veuillez saisir un montant supérieur à 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onRecordPayment({
        fiche_id: selectedFicheId,
        user_id: isFreeCollection ? (isAnonymous ? null : selectedUserId) : selectedUserId,
        nom_donateur_libre: isFreeCollection ? nomDonateur : undefined,
        is_anonymous: isAnonymous,
        montant: enteredAmount,
        mobile_provider: selectedProvider,
        phone_number: phoneNumber || users.find((user) => user.id === selectedUserId)?.phone,
        note: "Paiement enregistré depuis le tableau de bord",
      });

      onShowToast(
        result.pending
          ? "Demande envoyée. En attente de la confirmation de l’opérateur."
          : result.payment.statut === "valide"
            ? `Paiement confirmé : ${formatMoney(result.allocation?.regle_fiche ?? enteredAmount)} réglés + ${formatMoney(result.allocation?.credite_solde ?? 0)} crédités.`
            : "Paiement refusé par la passerelle.",
      );
      onClose();
    } catch (err: any) {
      onShowToast(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalId="admin-payment"
      panelClassName="w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl border border-[#eceef3] flex flex-col gap-5 my-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#eceef3] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#111418] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">payments</span>
          </div>
          <div>
            <h2 className="font-sora text-base font-bold text-[#181c20]">Enregistrer un paiement</h2>
            <p className="hidden lg:block text-xs text-[#777585]">Paiement direct Mobile Money ou encaissement guichet</p>
          </div>
        </div>
        <IconButton label="Fermer" icon="close" onClick={onClose} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Fiche Selection */}
        <div className="flex flex-col gap-1.5">
          <Label>Fiche de cotisation</Label>
          <Select
            value={selectedFicheId}
            onChange={(e) => {
              setSelectedFicheId(e.target.value);
              const fiche = fiches.find((f) => f.id === e.target.value);
              if (fiche?.montant_impose) {
                setMontant(String(fiche.montant_impose));
              }
            }}
            className="px-3 py-2"
          >
            {fiches.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} - {f.titre} ({f.type === "libre" ? "Don Libre" : formatMoney(f.montant_impose || 0)})
              </option>
            ))}
          </Select>
        </div>

        {/* Member Selection or Donor */}
        {!isFreeCollection ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="mb-0">Membre contributeur</Label>
              {userRecord && (
                <span className="text-[11px] text-[#777585]">
                  Reste dû : <strong>{formatMoney(userRecord.reste)}</strong>
                </span>
              )}
            </div>
            <Select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setPhoneNumber(users.find((user) => user.id === e.target.value)?.phone || "");
                const rec = selectedFiche ? records[selectedFiche.id]?.find((r) => r.user_id === e.target.value) : null;
                if (rec) setMontant(String(rec.reste > 0 ? rec.reste : 25));
              }}
              className="px-3 py-2"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.member_number}) - Solde avance: {formatMoney(u.solde_credit)}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label>Nom du donateur</Label>
            <Input
              type="text"
              disabled={isAnonymous}
              placeholder="Ex: David Ouedraogo ou Société Partenaire"
              value={nomDonateur}
              onChange={(e) => setNomDonateur(e.target.value)}
              className="px-3 py-2"
            />
            <Label htmlFor="admin-donation-phone">Téléphone Mobile Money (si paiement mobile)</Label>
            <Input
              id="admin-donation-phone"
              type="tel"
              placeholder="Ex: +243 99 123 4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="px-3 py-2"
            />
            <Checkbox label="Donateur anonyme" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          </div>
        )}

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <Label>Montant payé ({currencySymbol()})</Label>
          <Input
            type="number"
            min="1"
            step="0.5"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className="px-3.5 py-2 text-sm font-bold"
          />
        </div>

        {/* Automatic ventilation preview for obligatory sheets */}
        {!isFreeCollection && crediteSolde > 0 && (
          <div className="p-3 bg-secondary-container/30 rounded-xl text-xs text-[#001943] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span>
              {formatMoney(regleFiche)} solde la cotisation + <strong>+{formatMoney(crediteSolde)}</strong> versé dans le
              portefeuille de crédit d'avance du membre.
            </span>
          </div>
        )}

        <MobileMoneyProviderSelect value={selectedProvider} onChange={setSelectedProvider} label="Réseau de paiement" />

        {/* Submit */}
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full mt-2 shadow-md">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{isSubmitting ? "Validation..." : `Valider l'encaissement (${formatMoney(enteredAmount)})`}</span>
        </Button>
      </form>
    </Modal>
  );
};
