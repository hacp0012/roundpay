import React, { useState, useEffect } from "react";
import { FicheContribution, Payment, User } from "../../types";
import { questGet, getQuestToken } from "../../services/questClient";
import { formatMoney } from "../../config/currency";
import { Button, Checkbox, Spinner } from "../ui";

interface CollectesViewProps {
  onShowToast: (msg: string) => void;
}

type ExportFormat = "pdf" | "csv";

export const CollectesView: React.FC<CollectesViewProps> = ({ onShowToast }) => {
  const [fiches, setFiches] = useState<FicheContribution[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFicheId, setFilterFicheId] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const libresOnly = fiches.filter((f) => f.type === "libre");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fichesData, paymentsData, usersData] = await Promise.all([
        questGet<FicheContribution[]>("fiches.list"),
        questGet<Payment[]>("payments.list"),
        questGet<User[]>("users.list"),
      ]);
      setFiches(fichesData);
      setUsers(usersData);
      // Only keep payments for collectes libres
      const libreIds = new Set(fichesData.filter((f) => f.type === "libre").map((f) => f.id));
      setPayments(paymentsData.filter((p) => libreIds.has(p.fiche_id)));
    } catch (err: any) {
      onShowToast(err.message || "Erreur de chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (filterFicheId !== "all" && p.fiche_id !== filterFicheId) return false;
    if (filterDateFrom && p.date < filterDateFrom) return false;
    if (filterDateTo && p.date > filterDateTo + "T23:59") return false;

    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const donor = p.nom_donateur_libre || users.find((u) => u.id === p.user_id)?.name || "";
    return (
      donor.toLowerCase().includes(q) ||
      p.reference?.toLowerCase().includes(q) ||
      p.fiche_titre?.toLowerCase().includes(q) ||
      false
    );
  });

  const totalCollecte = filteredPayments.reduce((sum, p) => sum + p.montant, 0);
  const uniqueDonateurs = new Set(filteredPayments.map((p) => p.user_id ?? p.nom_donateur_libre ?? "anon")).size;

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = { format };
      if (filterFicheId !== "all") params.fiche_id = filterFicheId;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;

      const token = getQuestToken();
      const response = await fetch(`/api/quest/export.collectes?${new URLSearchParams(params).toString()}`, {
        headers: {
          Accept: format === "pdf" ? "application/pdf" : "text/csv",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur export (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `collectes_dons_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast(`Export ${format.toUpperCase()} téléchargé avec succès !`);
    } catch (err: any) {
      onShowToast(err.message || `Erreur lors de l'export ${format.toUpperCase()}.`);
    } finally {
      setIsExporting(false);
    }
  };

  const getDonorName = (p: Payment): string => {
    if (p.is_anonymous) return "Anonyme";
    if (p.nom_donateur_libre) return p.nom_donateur_libre;
    if (p.user_id) {
      const u = users.find((u) => u.id === p.user_id);
      return u?.name ?? `Membre #${p.user_id}`;
    }
    return "—";
  };

  const getProviderLabel = (provider: string): string => {
    const labels: Record<string, string> = {
      orange_money: "Orange Money",
      mpesa: "M-Pesa",
      airtel_money: "Airtel Money",
      mtn_momo: "MTN MoMo",
      wave: "Wave",
      cash_guichet: "Cash guichet",
    };
    return labels[provider] ?? provider;
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <Spinner className="w-8 h-8 border-3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">SUIVI DES DONS</span>
        <h1 className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">
          Collectes libres &amp; Dons
        </h1>
        <p className="text-sm text-on-surface-variant">
          Suivez tous les dons reçus sur les campagnes ouvertes. Exportez en PDF ou CSV directement depuis le serveur.
        </p>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#eceef3] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#777585]">Total collecté (filtre)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <span className="font-sora text-2xl font-bold text-[#181c20]">{formatMoney(totalCollecte)}</span>
          <span className="text-xs text-emerald-700 font-semibold">
            {filteredPayments.filter((p) => p.statut === "valide").length} versements valides
          </span>
        </div>

        <div className="bg-white p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#eceef3] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#777585]">Donateurs uniques</span>
            <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a56db] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">favorite</span>
            </div>
          </div>
          <span className="font-sora text-2xl font-bold text-[#181c20]">{uniqueDonateurs}</span>
          <span className="text-xs text-[#777585] font-semibold">personnes ont contribué</span>
        </div>

        <div className="bg-white p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#eceef3] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#777585]">Campagnes libres actives</span>
            <div className="w-8 h-8 rounded-full bg-secondary-container text-[#001943] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
            </div>
          </div>
          <span className="font-sora text-2xl font-bold text-[#181c20]">
            {libresOnly.filter((f) => f.statut === "ouverte").length}
          </span>
          <span className="text-xs text-primary font-semibold">{libresOnly.length} campagnes au total</span>
        </div>
      </section>

      {/* Filters & Export Bar */}
      <div className="bg-white rounded-[24px] border border-[#eceef3] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-end justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#777585] text-[16px]">
                search
              </span>
              <input
                type="text"
                placeholder="Donateur, référence, campagne…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-full border border-[#e0e2e7] bg-[#f7f9fe] text-[#181c20] placeholder:text-[#aaa] focus:outline-none focus:border-primary w-56"
              />
            </div>

            {/* Filter by fiche */}
            <select
              value={filterFicheId}
              onChange={(e) => setFilterFicheId(e.target.value)}
              className="px-3 py-2 text-xs rounded-full border border-[#e0e2e7] bg-[#f7f9fe] text-[#181c20] focus:outline-none focus:border-primary"
            >
              <option value="all">Toutes les campagnes</option>
              {libresOnly.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.titre}
                </option>
              ))}
            </select>

            {/* Date range */}
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="px-3 py-2 text-xs rounded-full border border-[#e0e2e7] bg-[#f7f9fe] text-[#181c20] focus:outline-none focus:border-primary"
              title="Date début"
            />
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="px-3 py-2 text-xs rounded-full border border-[#e0e2e7] bg-[#f7f9fe] text-[#181c20] focus:outline-none focus:border-primary"
              title="Date fin"
            />
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-[#e0e2e7] bg-white text-[#181c20] hover:bg-[#f7f9fe] transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">table_view</span>
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-[#181c20] text-white hover:bg-[#111418] transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              Export PDF
            </button>
          </div>
        </div>

        <p className="text-xs text-[#777585]">
          {filteredPayments.length} versement(s) trouvé(s) — Les exports sont générés par le serveur.
        </p>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-[24px] border border-[#eceef3] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#777585]">
            <span className="material-symbols-outlined text-[48px] text-[#d0d3db]">volunteer_activism</span>
            <span className="text-sm font-semibold">Aucun don trouvé pour ces filtres</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterFicheId("all");
                setFilterDateFrom("");
                setFilterDateTo("");
              }}
              className="text-xs text-primary underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#f7f9fe] border-b border-[#eceef3]">
                  <th className="text-left px-5 py-3 font-semibold text-[#777585]">Donateur</th>
                  <th className="text-left px-5 py-3 font-semibold text-[#777585]">Campagne</th>
                  <th className="text-left px-5 py-3 font-semibold text-[#777585]">Montant</th>
                  <th className="text-left px-5 py-3 font-semibold text-[#777585]">Moyen</th>
                  <th className="text-left px-5 py-3 font-semibold text-[#777585]">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-[#777585]">Statut</th>
                  <th className="text-left px-5 py-3 font-semibold text-[#777585]">Référence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f7]">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f7f9fe] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#181c20]">
                      <div className="flex items-center gap-2">
                        {p.is_anonymous && (
                          <span className="text-[#aaa]" title="Anonyme">
                            <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                          </span>
                        )}
                        {getDonorName(p)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#464554]">{p.fiche_titre ?? "—"}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700">{formatMoney(p.montant)}</td>
                    <td className="px-5 py-3.5 text-[#464554]">{getProviderLabel(p.mobile_provider)}</td>
                    <td className="px-5 py-3.5 text-[#777585]">{p.date?.split(" ")[0] ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.statut === "valide"
                            ? "bg-emerald-100 text-emerald-700"
                            : p.statut === "en_attente"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.statut === "valide" ? "Validé" : p.statut === "en_attente" ? "En attente" : "Échoué"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#777585] font-mono">{p.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign tiles */}
      <section className="flex flex-col gap-3">
        <h2 className="font-sora text-lg font-bold text-[#181c20]">Campagnes de collecte libre</h2>
        {libresOnly.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-[#eceef3] p-10 text-center text-[#777585] text-sm">
            Aucune campagne de collecte libre créée.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {libresOnly.map((f) => {
              const fichePayments = payments.filter((p) => p.fiche_id === f.id && p.statut === "valide");
              const totalFiche = fichePayments.reduce((s, p) => s + p.montant, 0);
              const progress =
                f.cagnotte_cible && f.cagnotte_cible > 0 ? Math.min(100, (totalFiche / f.cagnotte_cible) * 100) : null;

              return (
                <div
                  key={f.id}
                  className="bg-white p-5 rounded-[24px] border border-[#eceef3] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-[#181c20] leading-snug">{f.titre}</h3>
                      {f.beneficiaire && <span className="text-xs text-[#777585]">Pour : {f.beneficiaire}</span>}
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        f.statut === "ouverte" ? "bg-emerald-100 text-emerald-700" : "bg-[#eceef3] text-[#777585]"
                      }`}
                    >
                      {f.statut === "ouverte" ? "Ouverte" : f.statut}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#181c20]">{formatMoney(totalFiche)}</span>
                      {f.cagnotte_cible && <span className="text-[#777585]">/ {formatMoney(f.cagnotte_cible)}</span>}
                    </div>
                    {progress !== null && (
                      <div className="h-1.5 bg-[#eceef3] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                    <span className="text-[10px] text-[#777585]">
                      {fichePayments.length} don(s) — {f.is_public ? "Public" : "Privé"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
