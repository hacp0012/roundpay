import React, { useState } from "react";
import { FicheContribution, FicheStatus, Group } from "../../types";
import { formatMoney } from "../../config/currency";

interface FichesArchiveViewProps {
  fiches: FicheContribution[];
  groups: Group[];
  onBack: () => void;
  onOpenFicheDetail: (ficheId: string) => void;
  onUpdateFiche: (ficheId: string, updates: Partial<FicheContribution>) => Promise<void>;
  onShowToast: (msg: string) => void;
}

const STATUS_LABELS: Record<Exclude<FicheStatus, "ouverte">, string> = {
  fermee: "Désactivée",
  terminee: "Terminée",
};

export const FichesArchiveView: React.FC<FichesArchiveViewProps> = ({
  fiches,
  groups,
  onBack,
  onOpenFicheDetail,
  onUpdateFiche,
  onShowToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "fermee" | "terminee">("all");
  const [pendingFicheId, setPendingFicheId] = useState<string | null>(null);

  const archivedFiches = fiches.filter((fiche) => fiche.statut !== "ouverte");
  const filteredFiches = archivedFiches.filter((fiche) => filterStatus === "all" || fiche.statut === filterStatus);

  const handleReactivate = async (fiche: FicheContribution, event: React.MouseEvent) => {
    event.stopPropagation();
    setPendingFicheId(fiche.id);
    try {
      await onUpdateFiche(fiche.id, { statut: "ouverte" });
      onShowToast(`Fiche "${fiche.titre}" réactivée.`);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible de réactiver la fiche.");
    } finally {
      setPendingFicheId(null);
    }
  };

  const pillClass = (isActive: boolean) =>
    `px-4 py-1.5 rounded-full transition-all ${isActive ? "bg-white text-[#181c20] shadow-sm font-bold" : "hover:text-[#181c20]"}`;

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onBack}
          className="self-start flex items-center gap-1.5 text-xs font-semibold text-[#464554] hover:text-[#181c20] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Retour aux fiches actives</span>
        </button>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">ARCHIVES</span>
          <h1 className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">Fiches désactivées</h1>
          <p className="text-sm text-[#464554]">
            Fiches mises en pause ou terminées. Les fiches désactivées peuvent être réactivées depuis cette page.
          </p>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[#eceef3]/80 p-1 rounded-full text-xs font-semibold text-[#464554]">
          <button type="button" onClick={() => setFilterStatus("all")} className={pillClass(filterStatus === "all")}>
            Toutes ({archivedFiches.length})
          </button>
          <button type="button" onClick={() => setFilterStatus("fermee")} className={pillClass(filterStatus === "fermee")}>
            Désactivées ({archivedFiches.filter((fiche) => fiche.statut === "fermee").length})
          </button>
          <button type="button" onClick={() => setFilterStatus("terminee")} className={pillClass(filterStatus === "terminee")}>
            Terminées ({archivedFiches.filter((fiche) => fiche.statut === "terminee").length})
          </button>
        </div>
        <span className="text-xs text-[#777585]">{filteredFiches.length} affichée(s)</span>
      </div>

      {/* Archived Fiches List */}
      <div className="flex flex-col gap-3">
        {filteredFiches.length === 0 && (
          <div className="bg-white rounded-[24px] p-6 border border-dashed border-[#e0e2e7] text-center text-sm text-[#777585]">
            Aucune fiche désactivée ou terminée.
          </div>
        )}

        {filteredFiches.map((fiche) => {
          const group = groups.find((g) => g.id === fiche.group_id);
          const isTerminee = fiche.statut === "terminee";
          const isPending = pendingFicheId === fiche.id;

          return (
            <div
              key={fiche.id}
              onClick={() => onOpenFicheDetail(fiche.id)}
              className="bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-[#eceef3] hover:border-secondary-container transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {fiche.code}
                  </span>
                  <span className="text-xs font-semibold text-[#777585]">
                    {fiche.type === "obligatoire" ? group?.name || "Groupe" : "Collecte libre"}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isTerminee ? "bg-emerald-100 text-emerald-800" : "bg-[#eceef3] text-[#464554]"
                    }`}
                  >
                    {STATUS_LABELS[fiche.statut as Exclude<FicheStatus, "ouverte">]}
                  </span>
                </div>
                <h2 className="font-sora text-base font-bold text-[#181c20] truncate">{fiche.titre}</h2>
                <p className="text-xs text-[#777585]">
                  {fiche.type === "obligatoire"
                    ? `Imposé : ${formatMoney(fiche.montant_impose || 0)} / membre`
                    : `Objectif : ${formatMoney(fiche.cagnotte_cible || 0)}`}
                  {fiche.date_fin ? ` · Échéance : ${fiche.date_fin}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(event) => handleReactivate(fiche, event)}
                  disabled={isTerminee || isPending}
                  title={isTerminee ? "Une fiche terminée ne peut pas être réactivée" : "Réactiver la fiche"}
                  className="px-4 py-2 rounded-full bg-action hover:bg-action-hover text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">play_circle</span>
                  <span>{isPending ? "Réactivation..." : "Réactiver"}</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-[#181c20] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
