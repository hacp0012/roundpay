import React, { useEffect, useState } from "react";
import { FicheContribution, Group, User, FicheType, Payment } from "../../types";
import { formatMoney, currencySymbol } from "../../config/currency";
import { MemberAvatar } from "../common/MemberAvatar";
import { Modal } from "../modals/Modal";
import { Button, Checkbox, Input, Label } from "../ui";
import { mockApi } from "../../services/mockApi";

interface FichesViewProps {
  fiches: FicheContribution[];
  groups: Group[];
  users: User[];
  payments: Payment[];
  onOpenFicheDetail: (ficheId: string) => void;
  onCreateFiche: (data: {
    titre: string;
    motif: string;
    type: FicheType;
    group_id: string | null;
    montant_impose: number | null;
    cagnotte_cible?: number;
    date_debut: string;
    date_fin: string | null;
  }) => Promise<void>;
  onUpdateFiche: (ficheId: string, updates: Partial<FicheContribution>) => Promise<void>;
  onOpenArchives: () => void;
  onShowToast: (msg: string) => void;
}

export const FichesView: React.FC<FichesViewProps> = ({
  fiches,
  groups,
  users,
  payments,
  onOpenFicheDetail,
  onCreateFiche,
  onUpdateFiche,
  onOpenArchives,
  onShowToast,
}) => {
  const [filterType, setFilterType] = useState<"all" | "obligatoire" | "libre">("all");
  const [editingFiche, setEditingFiche] = useState<FicheContribution | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMotif, setEditMotif] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state for creating a new fiche
  const [formType, setFormType] = useState<FicheType>("obligatoire");
  const [formTitle, setFormTitle] = useState("");
  const [formMotif, setFormMotif] = useState("");
  const [formGroupId, setFormGroupId] = useState(groups[0]?.id || "");
  const [formAmount, setFormAmount] = useState("25");
  const [isFreeAmount, setIsFreeAmount] = useState(false);
  const [formTarget, setFormTarget] = useState("600");
  const [formDeadline, setFormDeadline] = useState(new Date().toISOString().slice(0, 10));
  const [isNoDeadline, setIsNoDeadline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(720);

  useEffect(() => {
    if (!formGroupId && groups[0]) {
      setFormGroupId(groups[0].id);
    }
  }, [formGroupId, groups]);

  const activeFiches = fiches.filter((fiche) => fiche.statut === "ouverte");
  const archivedCount = fiches.length - activeFiches.length;

  const filteredFiches = activeFiches.filter((f) => {
    if (filterType === "all") return true;
    return f.type === filterType;
  });

  const validPayments = payments.filter((payment) => payment.statut === "valide");
  const totalCollection = validPayments.reduce((total, payment) => total + payment.montant, 0);
  const totalCredits = users.reduce((total, user) => total + user.solde_credit, 0);

  const openEditModal = (fiche: FicheContribution, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingFiche(fiche);
    setEditTitle(fiche.titre);
    setEditMotif(fiche.motif);
    setEditAmount(fiche.montant_impose?.toString() || "");
    setEditTarget(fiche.cagnotte_cible?.toString() || "");
    setEditDeadline(fiche.date_fin || "");
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingFiche || !editTitle.trim()) return;

    setIsUpdating(true);
    try {
      await onUpdateFiche(editingFiche.id, {
        titre: editTitle.trim(),
        motif: editMotif.trim() || editTitle.trim(),
        montant_impose: editingFiche.type === "libre" || !editAmount ? null : Number(editAmount),
        cagnotte_cible: editTarget ? Number(editTarget) : null,
        date_fin: editDeadline || null,
      });
      setEditingFiche(null);
      onShowToast("Fiche mise à jour.");
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible de modifier la fiche.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeactivate = async (fiche: FicheContribution, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await onUpdateFiche(fiche.id, { statut: "fermee" });
      onShowToast("Fiche désactivée. Elle est disponible dans les archives.");
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible de désactiver la fiche.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onShowToast("Veuillez saisir un titre pour la fiche.");
      return;
    }
    if (formType === "obligatoire" && !formGroupId) {
      onShowToast("Créez un groupe avant d'ajouter une fiche obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateFiche({
        titre: formTitle,
        motif: formMotif || formTitle,
        type: formType,
        group_id: formType === "libre" ? null : formGroupId,
        montant_impose: formType === "libre" || isFreeAmount ? null : parseFloat(formAmount) || 20,
        cagnotte_cible: parseFloat(formTarget) || 500,
        date_debut: new Date().toISOString().split("T")[0],
        date_fin: isNoDeadline ? null : formDeadline,
      });

      onShowToast(`Fiche "${formTitle}" créée avec succès !`);
      setFormTitle("");
      setFormMotif("");
      setIsCreateDrawerOpen(false);
    } catch (err: any) {
      onShowToast(err.message || "Erreur lors de la création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemindLate = async (fiche: FicheContribution, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await mockApi.remindLateMembers(fiche.id);
      if (result.late === 0) {
        onShowToast(`Aucun membre en retard sur "${fiche.titre}".`);
        return;
      }
      const suffix = result.without_email > 0 ? ` ${result.without_email} sans adresse e-mail n'ont pas pu être joints.` : "";
      onShowToast(`Rappel envoyé par e-mail à ${result.sent} retardataire(s) pour "${fiche.titre}".${suffix}`);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible d'envoyer les rappels.");
    }
  };

  const handleComplete = async (fiche: FicheContribution, event: React.MouseEvent) => {
    event.stopPropagation();
    const confirmed = window.confirm(
      `Marquer "${fiche.titre}" comme terminée ? Elle ne recevra plus de paiements et sera déplacée dans les archives.`,
    );
    if (!confirmed) return;

    try {
      await onUpdateFiche(fiche.id, { statut: "terminee" });
      onShowToast("Fiche marquée comme terminée. Elle est disponible dans les archives.");
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible de terminer la fiche.");
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <Modal isOpen={Boolean(editingFiche)} onClose={() => setEditingFiche(null)} modalId="edit-contribution-fiche">
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div>
            <h2 className="font-sora text-lg font-bold text-[#181c20]">Modifier la fiche</h2>
            <p className="text-xs text-[#777585]">{editingFiche?.code}</p>
          </div>
          <div>
            <Label htmlFor="edit-fiche-title">Titre</Label>
            <Input id="edit-fiche-title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required />
          </div>
          <div>
            <Label htmlFor="edit-fiche-motif">Motif</Label>
            <Input id="edit-fiche-motif" value={editMotif} onChange={(event) => setEditMotif(event.target.value)} />
          </div>
          {editingFiche?.type === "obligatoire" && (
            <div>
              <Label htmlFor="edit-fiche-amount">Montant par membre ({currencySymbol()})</Label>
              <Input
                id="edit-fiche-amount"
                type="number"
                min="0"
                step="0.01"
                value={editAmount}
                onChange={(event) => setEditAmount(event.target.value)}
              />
            </div>
          )}
          <div>
            <Label htmlFor="edit-fiche-target">Objectif ({currencySymbol()})</Label>
            <Input
              id="edit-fiche-target"
              type="number"
              min="0"
              step="0.01"
              value={editTarget}
              onChange={(event) => setEditTarget(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-fiche-deadline">Date limite</Label>
            <Input
              id="edit-fiche-deadline"
              type="date"
              value={editDeadline}
              onChange={(event) => setEditDeadline(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setEditingFiche(null)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">GESTION DES COTISATIONS</span>
        <h1 className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">Fiches de cotisation</h1>
        <p className="text-sm text-[#464554]">
          Gérez les appels de fonds obligatoires et les cagnottes participatives de votre communauté.
        </p>
      </div>

      {/* 3 Bento Summary Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#eceef3] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#777585]">Fiches obligatoires actives</span>
            <div className="w-8 h-8 rounded-full bg-[#111418] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">rule</span>
            </div>
          </div>
          <div className="my-3">
            <span className="font-sora text-3xl font-bold text-[#181c20]">
              {fiches.filter((fiche) => fiche.type === "obligatoire" && fiche.statut === "ouverte").length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>sur {fiches.filter((fiche) => fiche.type === "obligatoire").length} au total</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#eceef3] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#777585]">Collectes libres &amp; Dons</span>
            <div className="w-8 h-8 rounded-full bg-secondary-container text-[#001943] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
            </div>
          </div>
          <div className="my-3">
            <span className="font-sora text-3xl font-bold text-[#181c20]">{formatMoney(totalCollection)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
            <span className="material-symbols-outlined text-[16px]">campaign</span>
            <span>{validPayments.length} paiements validés</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#eceef3] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#777585]">Avances en portefeuille</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="my-3">
            <span className="font-sora text-3xl font-bold text-[#181c20]">{formatMoney(totalCredits)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{users.filter((user) => user.solde_credit > 0).length} membres avec solde positif</span>
          </div>
        </div>
      </section>

      {/* Main Content Layout: Fiches list and creation card */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Fiches List */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 bg-[#eceef3]/80 p-1 rounded-2xl text-xs font-semibold text-[#464554]">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  filterType === "all" ? "bg-white text-[#181c20] shadow-sm font-bold" : "hover:text-[#181c20]"
                }`}
              >
                Toutes ({activeFiches.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("obligatoire")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  filterType === "obligatoire" ? "bg-white text-[#181c20] shadow-sm font-bold" : "hover:text-[#181c20]"
                }`}
              >
                Obligatoires Groupe ({activeFiches.filter((f) => f.type === "obligatoire").length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("libre")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  filterType === "libre" ? "bg-white text-[#181c20] shadow-sm font-bold" : "hover:text-[#181c20]"
                }`}
              >
                Collectes libres ({activeFiches.filter((f) => f.type === "libre").length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#777585]">{filteredFiches.length} affichée(s)</span>
              <button
                type="button"
                onClick={onOpenArchives}
                className="px-3.5 py-1.5 rounded-full bg-[#f1f4f9] hover:bg-[#eceef3] text-xs font-bold text-[#464554] hover:text-[#181c20] flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">archive</span>
                <span>Désactivées &amp; terminées ({archivedCount})</span>
              </button>
            </div>
          </div>

          {/* Fiches Cards Grid */}
          <div className="flex flex-col gap-4">
            {filteredFiches.map((fiche) => {
              const group = groups.find((g) => g.id === fiche.group_id);
              const isObligatoire = fiche.type === "obligatoire";
              const ficheMembers = isObligatoire
                ? users.filter((user) => user.is_member && group && user.group_ids.includes(group.id))
                : Array.from(
                    new Set<string>(
                      validPayments
                        .filter((payment) => payment.fiche_id === fiche.id && payment.user_id)
                        .map((payment) => payment.user_id)
                        .filter((userId): userId is string => userId !== null),
                    ),
                  )
                    .map((userId) => users.find((user) => user.id === userId))
                    .filter((user): user is User => Boolean(user?.is_member));
              const collectedAmount = validPayments
                .filter((payment) => payment.fiche_id === fiche.id)
                .reduce((total, payment) => total + payment.montant, 0);
              const targetAmount =
                fiche.cagnotte_cible ||
                (fiche.type === "obligatoire" ? (fiche.montant_impose || 0) * (group?.member_count || 0) : 0);
              const percent = targetAmount > 0 ? Math.min(100, Math.round((collectedAmount / targetAmount) * 100)) : 0;

              return (
                <div
                  key={fiche.id}
                  onClick={() => onOpenFicheDetail(fiche.id)}
                  className="bg-white rounded-[24px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.03)] border border-[#eceef3] hover:border-secondary-container transition-all cursor-pointer group flex flex-col gap-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {fiche.code}
                        </span>
                        <span className="text-xs font-semibold text-[#777585]">
                          {isObligatoire ? group?.name || "Groupe A" : "Collecte Libre Ouverte"}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isObligatoire ? "bg-amber-100 text-amber-900" : "bg-secondary-container/40 text-[#001943]"
                          }`}
                        >
                          {isObligatoire ? "Obligatoire" : "Don libre"} · {fiche.statut}
                        </span>
                      </div>
                      <h2 className="font-sora text-lg font-bold text-[#181c20] group-hover:text-primary transition-colors mt-1">
                        {fiche.titre}
                      </h2>
                      <p className="text-xs text-[#464554] line-clamp-1">{fiche.motif}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isObligatoire && (
                        <button
                          type="button"
                          onClick={(e) => handleRemindLate(fiche, e)}
                          className="px-3 py-1.5 rounded-full bg-[#f1f4f9] hover:bg-[#eceef3] text-xs font-bold text-[#464554] flex items-center gap-1 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">notification_important</span>
                          <span>Relancer</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(event) => openEditModal(fiche, event)}
                        className="w-8 h-8 rounded-full bg-[#f1f4f9] text-[#181c20] hover:bg-secondary-container flex items-center justify-center"
                        title="Modifier la fiche"
                        aria-label={`Modifier ${fiche.titre}`}
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleComplete(fiche, event)}
                        className="w-8 h-8 rounded-full bg-[#f1f4f9] text-[#181c20] hover:bg-secondary-container flex items-center justify-center"
                        title="Marquer comme terminée"
                        aria-label={`Terminer ${fiche.titre}`}
                      >
                        <span className="material-symbols-outlined text-[17px]">task_alt</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleDeactivate(fiche, event)}
                        className="w-8 h-8 rounded-full bg-[#f1f4f9] text-[#181c20] hover:bg-secondary-container flex items-center justify-center"
                        title="Désactiver la fiche"
                        aria-label={`Désactiver ${fiche.titre}`}
                      >
                        <span className="material-symbols-outlined text-[17px]">pause_circle</span>
                      </button>
                      <div className="w-8 h-8 rounded-full bg-[#181c20] text-white flex items-center justify-center group-hover:bg-action-hover transition-all">
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Amount Row */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-sora text-base font-bold text-[#181c20]">{formatMoney(collectedAmount)}</span>
                        <span className="text-[#777585]">sur {formatMoney(targetAmount)} cible</span>
                      </div>
                      <span className="font-sora font-bold text-sm text-primary">{percent}%</span>
                    </div>

                    <div className="w-full bg-[#eceef3] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent >= 90 ? "bg-emerald-500" : percent >= 70 ? "bg-primary-container" : "bg-amber-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer metadata & Members avatars */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#eceef3] text-xs text-[#777585]">
                    <div className="flex items-center gap-4">
                      {isObligatoire ? (
                        <span className="font-medium text-[#181c20]">
                          Imposé : <strong>{formatMoney(fiche.montant_impose || 0)} / membre</strong>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">favorite</span>
                          Dons anonymes acceptés
                        </span>
                      )}

                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        {fiche.date_fin ? `Échéance : ${fiche.date_fin}` : "Sans date limite"}
                      </span>
                    </div>

                    {/* Member Avatars Capsule */}
                    <div className="flex items-center -space-x-2" aria-label="Membres associés à cette fiche">
                      {ficheMembers.slice(0, 4).map((u) => (
                        <MemberAvatar
                          key={u.id}
                          src={u.avatar}
                          name={u.name}
                          className="w-7 h-7 border-2 border-white shadow-xs"
                        />
                      ))}
                      {ficheMembers.length > 4 && (
                        <span className="w-7 h-7 rounded-full bg-[#111418] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                          +{ficheMembers.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[#001943]">
              <span className="material-symbols-outlined text-[20px]">post_add</span>
            </div>
            <div>
              <h2 className="font-sora text-base font-bold text-[#181c20]">Nouvel appel de fonds</h2>
              <p className="text-xs text-[#777585]">Créez une cotisation ou une collecte.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#464554]">
            Définissez le motif, le groupe concerné, le montant et l’échéance. Les membres concernés pourront ensuite
            consulter la fiche et suivre les contributions.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-xs text-[#777585]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">rule</span>
              Cotisation obligatoire pour un groupe
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">volunteer_activism</span>
              Collecte libre avec objectif
            </div>
          </div>
          <Button type="button" onClick={() => setIsCreateDrawerOpen(true)} size="md" className="mt-5 w-full">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Ajouter une fiche
          </Button>
        </aside>

        <Modal
          isOpen={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          modalId="create-contribution-fiche"
          placement="right"
          ariaLabelledBy="create-fiche-title"
          overlayClassName="justify-end p-0 overflow-hidden"
          panelClassName="relative h-full w-full max-w-none p-0 border-0 rounded-none bg-transparent shadow-none"
        >
          <div
            className="relative ml-auto flex h-full max-w-full flex-col border-l border-[#eceef3] bg-white shadow-2xl"
            style={{ width: `${drawerWidth}px`, maxWidth: "calc(100vw - 0.75rem)" }}
          >
            <div
              role="separator"
              aria-label="Redimensionner le panneau"
              aria-orientation="vertical"
              aria-valuemin={420}
              aria-valuemax={Math.max(420, window.innerWidth - 12)}
              aria-valuenow={Math.min(drawerWidth, Math.max(420, window.innerWidth - 12))}
              tabIndex={0}
              className="absolute inset-y-0 left-0 z-10 flex w-3 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center outline-none before:h-16 before:w-1 before:rounded-full before:bg-[#c7c9d1] hover:before:bg-primary focus-visible:before:bg-primary"
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                setDrawerWidth(Math.min(window.innerWidth - 12, Math.max(420, window.innerWidth - event.clientX)));
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  setDrawerWidth((width) =>
                    Math.min(
                      window.innerWidth - 12,
                      Math.max(420, width + (event.key === "ArrowLeft" ? 24 : -24)),
                    ),
                  );
                }
              }}
            />
            <header className="flex shrink-0 items-center justify-between border-b border-[#eceef3] px-5 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111418] text-white">
                  <span className="material-symbols-outlined text-[20px]">post_add</span>
                </div>
                <div>
                  <h2 id="create-fiche-title" className="font-sora text-base font-bold text-[#181c20]">
                    Ajouter une fiche
                  </h2>
                  <p className="text-xs text-[#777585]">Définissez les modalités de l'appel de fonds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#464554] hover:bg-[#f1f4f9]"
                aria-label="Fermer le panneau"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </header>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
            {/* Type Selector (Obligatoire vs Libre) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Type de cotisation</label>
              <div className="grid grid-cols-2 gap-2 bg-[#f1f4f9] p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormType("obligatoire")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    formType === "obligatoire" ? "bg-[#111418] text-white shadow-sm" : "text-[#464554] hover:text-[#181c20]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">rule</span>
                  <span>Obligatoire</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("libre")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    formType === "libre" ? "bg-primary text-white shadow-sm" : "text-[#464554] hover:text-[#181c20]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
                  <span>Collecte Libre</span>
                </button>
              </div>
            </div>

            {/* Titre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Titre de la fiche</label>
              <input
                type="text"
                placeholder="Ex: Achat Chaises & Tables"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-[#181c20]"
              />
            </div>

            {/* Motif & Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Motif &amp; Justification</label>
              <textarea
                rows={8}
                placeholder="Description du projet et utilité communautaire..."
                value={formMotif}
                onChange={(e) => setFormMotif(e.target.value)}
                className="min-h-48 w-full resize-y rounded-xl border border-[#e0e2e7] bg-[#f7f9fe] px-3.5 py-2 text-sm text-[#181c20] transition-all focus:border-primary focus:bg-white focus:outline-none"
              />
            </div>

            {/* Groupe Cible (if Obligatoire) */}
            {formType === "obligatoire" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#181c20]">Groupe concerné</label>
                <select
                  value={formGroupId}
                  onChange={(e) => setFormGroupId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-[#181c20]"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.member_count} membres)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Montant Imposé (if Obligatoire) */}
            {formType === "obligatoire" ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#181c20]">Montant par membre ({currencySymbol()})</label>
                  <Checkbox
                    label="Montant libre"
                    checked={isFreeAmount}
                    onChange={(e) => setIsFreeAmount(e.target.checked)}
                    className="rounded"
                  />
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  disabled={isFreeAmount}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-[#181c20] disabled:opacity-50"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#181c20]">Objectif de cagnotte ({currencySymbol()})</label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder={`Ex: 5 000 ${currencySymbol()}`}
                  className="w-full px-3.5 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-[#181c20]"
                />
              </div>
            )}

            {/* Date Limite / Échéance */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#181c20]">Date limite d'encaissement</label>
                <Checkbox
                  label="Sans date limite"
                  checked={isNoDeadline}
                  onChange={(e) => setIsNoDeadline(e.target.checked)}
                />
              </div>
              <input
                type="date"
                disabled={isNoDeadline}
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-[#181c20] disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-full bg-action hover:bg-action-hover text-white font-sora font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              <span>{isSubmitting ? "Publication en cours..." : "Publier la fiche"}</span>
            </button>

            <p className="text-[11px] text-[#777585] text-center">
              Les membres du groupe seront automatiquement notifiés par notification mobile.
            </p>
          </form>
          </div>
        </Modal>
      </section>
    </div>
  );
};
