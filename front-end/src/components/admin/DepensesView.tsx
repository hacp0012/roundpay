import React, { useState } from "react";
import { DepenseProjet, TreasuryOverview } from "../../types";
import { formatMoney, currencySymbol } from "../../config/currency";

interface DepensesViewProps {
  depenses: DepenseProjet[];
  overview: TreasuryOverview;
  onAddDepense: (data: {
    titre: string;
    montant: number;
    categorie: string;
    description: string;
    cree_par: string;
  }) => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const DepensesView: React.FC<DepensesViewProps> = ({ depenses, overview, onAddDepense, onShowToast }) => {
  const [titre, setTitre] = useState("");
  const [montant, setMontant] = useState("450");
  const [categorie, setCategorie] = useState("Mobilier & Aménagement");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
  const resteEnCaisse = overview.solde_total_caisse;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !montant) {
      onShowToast("Veuillez renseigner le titre et le montant de la dépense.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddDepense({
        titre,
        montant: parseFloat(montant) || 0,
        categorie,
        description: description || titre,
        cree_par: "Sophie M. (Trésorière)",
      });

      onShowToast(`Dépense de ${formatMoney(Number(montant) || 0)} enregistrée avec succès !`);
      setTitre("");
      setDescription("");
    } catch (err: any) {
      onShowToast(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">TRANSPARENCE FINANCIÈRE</span>
        <h1 className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">
          Dépenses &amp; Caisse collective
        </h1>
        <p className="text-sm text-[#464554]">
          Suivez les dépenses investies dans les projets communs et justifiées par facture.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-secondary-container text-[#001943] p-6 rounded-[28px] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2e4676]">Reste net en caisse</span>
          <span className="font-sora text-4xl font-bold my-2">{formatMoney(resteEnCaisse)}</span>
          <span className="text-xs text-[#3a5183]">Disponible immédiatement sur les comptes Mobile Money</span>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#eceef3] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#777585]">Total des dépenses engagées</span>
          <span className="font-sora text-3xl font-bold text-[#ba1a1a] my-2">-{formatMoney(totalDepenses)}</span>
          <span className="text-xs text-[#777585]">{depenses.length} factures et décaissements</span>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#eceef3] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#777585]">Taux d'exécution budgétaire</span>
          <span className="font-sora text-3xl font-bold text-emerald-700 my-2">
            {Math.round((totalDepenses / (totalDepenses + resteEnCaisse)) * 100)}%
          </span>
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            100% justifié avec pièces comptables
          </span>
        </div>
      </section>

      {/* Grid: Depenses list + New Expense form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Depenses Table */}
        <div className="min-w-0 lg:col-span-8 bg-white rounded-[28px] p-5 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sora text-base font-bold text-[#181c20]">Registre des décaissements</h2>
            <span className="text-xs text-[#777585]">{depenses.length} dépenses</span>
          </div>

          <div className="flex flex-col gap-3">
            {depenses.map((dep) => (
              <div
                key={dep.id}
                className="p-4 bg-[#f7f9fe] rounded-2xl border border-[#eceef3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f1f4f9] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">receipt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-[#181c20]">{dep.titre}</span>
                    <div className="flex items-center gap-2 text-xs text-[#777585]">
                      <span className="px-2 py-0.5 rounded-md bg-[#e0e2e7] text-[#181c20] text-[10px] font-bold">
                        {dep.categorie}
                      </span>
                      <span>{dep.date}</span>
                      <span>•</span>
                      <span>Par {dep.cree_par}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-13 sm:pl-0">
                  <span className="font-sora text-base font-bold text-red-600">-{formatMoney(dep.montant)}</span>
                  {dep.preuve_ref && (
                    <button
                      type="button"
                      onClick={() => onShowToast(`Justificatif ${dep.preuve_ref} téléchargé.`)}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">attach_file</span>
                      <span>{dep.preuve_ref}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Register an Expense */}
        <div className="lg:col-span-4 bg-white rounded-[32px] p-6 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] border border-[#eceef3] flex flex-col gap-4 sticky top-24">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#111418] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
            </div>
            <div>
              <h2 className="font-sora text-base font-bold text-[#181c20]">Enregistrer une dépense</h2>
              <p className="text-xs text-[#777585]">Déduction immédiate de la caisse commune</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Libellé de la dépense</label>
              <input
                type="text"
                placeholder="Ex: Achat 30 chaises pliantes"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-xs text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Montant décaissé ({currencySymbol()})</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm font-bold text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Catégorie</label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full px-3 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-xs text-[#181c20]"
              >
                <option value="Mobilier & Aménagement">Mobilier &amp; Aménagement</option>
                <option value="Travaux & Rénovation">Travaux &amp; Rénovation</option>
                <option value="Équipement & Sono">Équipement &amp; Sono</option>
                <option value="Logistique & Transport">Logistique &amp; Transport</option>
                <option value="Frais de Cérémonie">Frais de Cérémonie</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#181c20]">Facture &amp; Justificatif</label>
              <div className="p-3 border border-dashed border-secondary-container rounded-xl bg-[#f7f9fe] text-center cursor-pointer hover:bg-white transition-all">
                <span className="material-symbols-outlined text-[24px] text-primary">cloud_upload</span>
                <span className="block text-xs font-bold text-[#181c20] mt-1">Joindre facture PDF ou photo reçu</span>
                <span className="block text-[10px] text-[#777585]">Max 10 Mo · PNG, JPG, PDF</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-full bg-action hover:bg-action-hover text-white font-sora font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>{isSubmitting ? "Validation..." : "Valider la dépense"}</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
