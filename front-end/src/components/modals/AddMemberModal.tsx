import React, { useState } from "react";
import { Group } from "../../types";
import { Modal } from "./Modal";
import { Button, IconButton, Input, Label, Select } from "../ui";
import { currencySymbol } from "../../config/currency";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  onAddMember: (data: {
    name: string;
    phone: string;
    pin: string;
    email?: string;
    solde_credit?: number;
    group_ids?: string[];
  }) => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, groups, onAddMember, onShowToast }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+243");
  const [rawPhone, setRawPhone] = useState("");
  const [pin, setPin] = useState("1234");
  const [email, setEmail] = useState("");
  const [soldeCredit, setSoldeCredit] = useState("0");
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || "groupe-a");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<{
    name: string;
    phone: string;
    pin: string;
    member_number?: string;
  } | null>(null);

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(randomPin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast("Veuillez renseigner le nom complet du membre.");
      return;
    }

    const fullPhone = rawPhone.startsWith("+") ? rawPhone.trim() : `${countryCode} ${rawPhone.trim()}`;
    if (!rawPhone.trim()) {
      onShowToast("Veuillez saisir le numéro de téléphone.");
      return;
    }

    if (pin.length < 4) {
      onShowToast("Le code PIN doit comporter au moins 4 chiffres.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddMember({
        name: name.trim(),
        phone: fullPhone,
        pin: pin.trim(),
        email: email.trim() || undefined,
        solde_credit: parseFloat(soldeCredit) || 0,
        group_ids: [selectedGroupId],
      });

      setCreatedSuccess({
        name: name.trim(),
        phone: fullPhone,
        pin: pin.trim(),
      });
      onShowToast(`Membre ${name} ajouté avec succès !`);
    } catch (err) {
      console.error(err);
      onShowToast("Erreur lors de l'enregistrement du membre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setName("");
    setRawPhone("");
    setPin("1234");
    setEmail("");
    setSoldeCredit("0");
    setCreatedSuccess(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={createdSuccess ? handleResetAndClose : onClose}
      modalId="add-member"
      panelClassName="w-full max-w-lg bg-white rounded-[28px] p-5 sm:p-6 shadow-2xl border border-[#eceef3] my-auto"
    >
      {createdSuccess ? (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">person_check</span>
          </div>

          <div>
            <h2 className="text-xl font-bold font-sora text-[#181c20]">Membre inscrit avec succès !</h2>
            <p className="hidden lg:block text-xs text-[#777585] mt-1 max-w-sm">
              Transmettez ces identifiants au membre pour qu'il puisse se connecter à son espace personnel :
            </p>
          </div>

          <div className="w-full bg-[#f7f9fe] border border-secondary-container/30 rounded-2xl p-5 text-left space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[#e0e2e7]">
              <span className="text-[#777585]">Nom :</span>
              <span className="font-bold text-[#181c20]">{createdSuccess.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[#e0e2e7]">
              <span className="text-[#777585]">Identifiant (Téléphone) :</span>
              <span className="font-mono font-bold text-[#181c20]">{createdSuccess.phone}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#777585]">Code PIN de connexion :</span>
              <span className="font-mono font-bold text-base text-primary bg-white px-3 py-1 rounded-lg border border-secondary-container/40">
                {createdSuccess.pin}
              </span>
            </div>
          </div>

          <p className="hidden lg:block text-[11px] text-[#777585]">
            Le membre peut se connecter immédiatement sur la page d'accueil de la plateforme.
          </p>

          <Button type="button" id="btn-close-created-member" onClick={handleResetAndClose} size="lg" className="w-full">
            Terminer & fermer
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#eceef3]">
            <div>
              <span className="hidden lg:block text-[11px] font-bold uppercase tracking-wider text-primary">
                Administration des Membres
              </span>
              <h2 className="font-sora text-xl font-bold text-[#181c20]">Ajouter un nouveau membre</h2>
            </div>
            <IconButton label="Fermer" icon="close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="input-member-name">Nom complet & Prénom *</Label>
              <Input
                id="input-member-name"
                type="text"
                required
                placeholder="Ex: Jean-Baptiste Kaboré"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-2.5 rounded-2xl font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="input-member-phone">Numéro de téléphone (Identifiant de connexion) *</Label>
              <div className="flex gap-2">
                <Select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="!w-[8.75rem] shrink-0 font-bold rounded-2xl px-3 py-2.5"
                >
                  <option value="+243">+243 (RDC)</option>
                  <option value="+221">+221 (Sénégal)</option>
                  <option value="+225">+225 (Côte d'Ivoire)</option>
                  <option value="+223">+223 (Mali)</option>
                  <option value="+226">+226 (Burkina)</option>
                  <option value="+33">+33 (France)</option>
                  <option value="+212">+212 (Maroc)</option>
                  <option value="+237">+237 (Cameroun)</option>
                </Select>
                <Input
                  id="input-member-phone"
                  type="tel"
                  required
                  placeholder="82 54 11 092"
                  value={rawPhone}
                  onChange={(e) => setRawPhone(e.target.value)}
                  className="min-w-0 !flex-1 !w-auto px-4 py-2.5 rounded-2xl font-mono font-bold"
                />
              </div>
              <span className="hidden lg:block text-[10px] text-[#777585] mt-1">
                Ce numéro servira d'identifiant unique pour la connexion mobile du client.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="input-member-pin" className="mb-0">
                    Code PIN (Mot de passe) *
                  </Label>
                  <Button variant="ghost" size="sm" onClick={handleGeneratePin} className="text-[10px] px-1 py-0">
                    Générer aléatoire
                  </Button>
                </div>
                <Input
                  id="input-member-pin"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl font-mono font-bold text-center tracking-widest"
                />
              </div>

              <div>
                <Label htmlFor="select-member-group">Groupe d'assignation</Label>
                <Select
                  id="select-member-group"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl font-bold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="input-member-credit">Solde avance initial ({currencySymbol()})</Label>
                <Input
                  id="input-member-credit"
                  type="number"
                  min="0"
                  step="5"
                  placeholder="0"
                  value={soldeCredit}
                  onChange={(e) => setSoldeCredit(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl font-mono font-bold"
                />
                <span className="hidden lg:block text-[10px] text-[#777585] mt-0.5">Crédit d'avance pour futures fiches</span>
              </div>

            </div>

            <div>
              <Label htmlFor="input-member-email">Email (Optionnel)</Label>
              <Input
                id="input-member-email"
                type="email"
                placeholder="membre@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2.5 rounded-2xl font-semibold"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#eceef3]">
              <Button variant="ghost" onClick={onClose}>
                Annuler
              </Button>

              <Button type="submit" id="btn-submit-add-member" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer le membre"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
};
