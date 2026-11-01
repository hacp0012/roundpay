import React, { useState } from "react";
import { TreasuryOverview, Payment, User, Group, FicheContribution } from "../../types";
import { MobileMoneyBadge } from "../common/MobileMoneyBadges";
import { formatMoney } from "../../config/currency";
import { MemberAvatar } from "../common/MemberAvatar";
import { mockApi } from "../../services/mockApi";

interface DashboardViewProps {
  overview: TreasuryOverview;
  recentPayments: Payment[];
  users: User[];
  groups: Group[];
  fiches: FicheContribution[];
  onOpenCreateFiche: () => void;
  onOpenRecordPayment: () => void;
  onOpenFicheDetail: (ficheId: string) => void;
  onNavigateToView: (view: any) => void;
  onShowToast: (msg: string) => void;
  adminName?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  recentPayments,
  users,
  groups,
  fiches,
  onOpenCreateFiche,
  onOpenRecordPayment,
  onOpenFicheDetail,
  onNavigateToView,
  onShowToast,
  adminName,
}) => {
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly">("weekly");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const daysToShow = chartPeriod === "weekly" ? 7 : 28;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chartStart = new Date(today);
  chartStart.setDate(today.getDate() - daysToShow + 1);
  const chartBuckets = Array.from({ length: chartPeriod === "weekly" ? 7 : 4 }, (_, index) => {
    const start = new Date(chartStart);
    start.setDate(chartStart.getDate() + (chartPeriod === "weekly" ? index : index * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + (chartPeriod === "weekly" ? 1 : 7));
    const amount = recentPayments.reduce((total, payment) => {
      if (payment.statut !== "valide") return total;
      const paidAt = new Date(payment.date.replace(" ", "T"));
      return paidAt >= start && paidAt < end ? total + payment.montant : total;
    }, 0);

    return {
      day:
        chartPeriod === "weekly" ? new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(start) : `Sem ${index + 1}`,
      amount,
    };
  });
  const maxChartAmount = Math.max(...chartBuckets.map((bucket) => bucket.amount), 1);
  const chartData = chartBuckets.map((bucket) => ({
    day: bucket.day,
    individual: bucket.amount === 0 ? 0 : Math.max(8, Math.round((bucket.amount / maxChartAmount) * 100)),
    amount: formatMoney(bucket.amount),
  }));
  const activeFiches = fiches.filter((fiche) => fiche.statut === "ouverte");
  const featuredFiches = activeFiches.slice(0, 2);
  const totalCollected = overview.total_collecte;
  const mandatoryFiches = fiches.filter((fiche) => fiche.type === "obligatoire");
  const freeFiches = fiches.filter((fiche) => fiche.type === "libre");
  const recentContributorIds = [
    ...new Set(
      recentPayments
        .filter((payment) => payment.statut === "valide")
        .map((payment) => payment.user_id)
        .filter((userId): userId is string => userId !== null),
    ),
  ];
  const recentContributors = recentContributorIds
    .map((userId) => users.find((user) => user.id === userId))
    .filter((user): user is User => Boolean(user))
    .slice(0, 6);
  const collectedForFiches = (targetFiches: FicheContribution[]) =>
    recentPayments
      .filter((payment) => payment.statut === "valide" && targetFiches.some((fiche) => fiche.id === payment.fiche_id))
      .reduce((total, payment) => total + payment.montant, 0);

  const handleRemindAllLate = async () => {
    const openObligatoires = fiches.filter((fiche) => fiche.type === "obligatoire" && fiche.statut === "ouverte");
    if (openObligatoires.length === 0) {
      onShowToast("Aucune fiche obligatoire ouverte à relancer.");
      return;
    }

    try {
      const results = await Promise.all(openObligatoires.map((fiche) => mockApi.remindLateMembers(fiche.id)));
      const sent = results.reduce((total, result) => total + result.sent, 0);
      const withoutEmail = results.reduce((total, result) => total + result.without_email, 0);
      const late = results.reduce((total, result) => total + result.late, 0);
      if (late === 0) {
        onShowToast("Aucun membre en retard.");
        return;
      }
      const suffix = withoutEmail > 0 ? ` ${withoutEmail} sans adresse e-mail n'ont pas pu être joints.` : "";
      onShowToast(`Rappels envoyés par e-mail : ${sent} membre(s) en retard.${suffix}`);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible d'envoyer les rappels.");
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,ID,Date,Membre/Donateur,Fiche,Montant,Operateur,Statut\n" +
      recentPayments
        .map(
          (p) =>
            `${p.id},${p.date},"${p.nom_donateur_libre || p.user_id || "Anonyme"}","${p.fiche_titre || ""}",${p.montant},${p.mobile_provider},${p.statut}`,
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `roundpay_releve_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast("Relevé CSV exporté avec succès !");
  };

  const filteredPayments = recentPayments.filter((p) => {
    if (selectedGroupFilter === "all") return true;
    const fiche = fiches.find((item) => item.id === p.fiche_id);
    if (selectedGroupFilter === "libre") return fiche?.type === "libre";
    return fiche?.group_id === selectedGroupFilter;
  });

  return (
    <div className="flex flex-col w-full min-w-0 gap-6">
      {/* Top Greeting & Header Metadata */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">ESPACE TRÉSORIÈRE GÉNÉRALE</span>
          <h1 className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">
            Bonjour, {adminName || "Trésorerie"} !
          </h1>
          <p className="text-sm text-[#464554]">Vue d'ensemble des cagnottes, groupes et cotisations de la communauté.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e0e2e7]/60">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-[#181c20] font-semibold">Données du backend synchronisées</span>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#eceef3] text-[#181c20] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e0e2e7]/60 text-xs font-bold transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Relevé PDF/CSV</span>
          </button>
        </div>
      </section>

      {/* Top Hero Row: Periwinkle Balance Card + 2 Highlight Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Hero Balance Pod (Soft Periwinkle Pill/Card) */}
        <div className="min-w-0 lg:col-span-6 bg-secondary-container text-[#001943] rounded-[28px] p-5 sm:p-6 flex flex-col justify-between shadow-[0_16px_36px_-12px_rgb(var(--app-color-rgb)/0.14)] relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-[#e2dfff] opacity-50 blur-3xl pointer-events-none"></div>

          <div className="flex flex-col items-center text-center gap-1.5 relative z-10">
            <div className="flex items-center gap-1.5 text-[#2e4676]">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
              <span className="text-xs uppercase tracking-wider font-semibold">Solde total en caisse</span>
            </div>
            <div className="font-sora text-4xl sm:text-5xl font-bold text-[#001943] tracking-tight">
              {formatMoney(overview.solde_total_caisse)}
            </div>
            <div className="inline-flex items-center gap-1 text-emerald-800 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm mt-1">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span>{activeFiches.length} fiche(s) ouverte(s)</span>
            </div>
          </div>

          {/* 4 Black Circular Action Pods */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-6 relative z-10">
            {/* Action 1: Nouvelle fiche */}
            <div onClick={onOpenCreateFiche} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <button
                type="button"
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#111418] text-white flex items-center justify-center shadow-[0_10px_20px_-6px_rgba(17,20,24,0.25)] group-hover:scale-105 group-hover:bg-action-hover transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[24px]">add</span>
              </button>
              <span className="text-xs text-[#001943] text-center font-medium leading-tight group-hover:text-primary transition-colors">
                Nouvelle fiche
              </span>
            </div>

            {/* Action 2: Enregistrer paiement */}
            <div onClick={onOpenRecordPayment} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <button
                type="button"
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#111418] text-white flex items-center justify-center shadow-[0_10px_20px_-6px_rgba(17,20,24,0.25)] group-hover:scale-105 group-hover:bg-action-hover transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_downward_alt</span>
              </button>
              <span className="text-xs text-[#001943] text-center font-medium leading-tight group-hover:text-primary transition-colors">
                Enregistrer paiement
              </span>
            </div>

            {/* Action 3: Collecte libre */}
            <div
              onClick={() => onNavigateToView("collectes")}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <button
                type="button"
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#111418] text-white flex items-center justify-center shadow-[0_10px_20px_-6px_rgba(17,20,24,0.25)] group-hover:scale-105 group-hover:bg-action-hover transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
              </button>
              <span className="text-xs text-[#001943] text-center font-medium leading-tight group-hover:text-primary transition-colors">
                Collecte libre
              </span>
            </div>

            {/* Action 4: Rappels groupés */}
            <div onClick={handleRemindAllLate} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <button
                type="button"
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#111418] text-white flex items-center justify-center shadow-[0_10px_20px_-6px_rgba(17,20,24,0.25)] group-hover:scale-105 group-hover:bg-action-hover transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[22px]">notifications_active</span>
              </button>
              <span className="text-xs text-[#001943] text-center font-medium leading-tight group-hover:text-primary transition-colors">
                Rappels groupés
              </span>
            </div>
          </div>
        </div>

        {/* White Floating Card 1: Tontine Santé */}
        <div
          onClick={() => featuredFiches[0] && onOpenFicheDetail(featuredFiches[0].id)}
          className="lg:col-span-3 bg-white rounded-[32px] p-6 sm:p-7 flex flex-col justify-between shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] hover:shadow-[0_12px_32px_-4px_rgba(17,20,24,0.08)] cursor-pointer transition-all border border-transparent hover:border-secondary-container"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </div>
              <span className="font-sora text-base text-[#181c20] font-bold">
                {featuredFiches[0]?.titre || "Aucune fiche ouverte"}
              </span>
            </div>
            <button type="button" className="text-[#777585] hover:text-[#181c20]">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>

          <div className="my-4">
            <div className="inline-block px-3 py-1 bg-emerald-100/70 text-emerald-800 rounded-full text-xs font-bold mb-2">
              {featuredFiches[0]?.type === "libre" ? "Collecte libre" : "Cotisation obligatoire"}
            </div>
            <div className="text-sm text-[#464554]">
              {groups.find((group) => group.id === featuredFiches[0]?.group_id)?.name ||
                featuredFiches[0]?.motif ||
                "Aucune collecte active"}
            </div>
            <div className="font-sora text-2xl font-bold text-[#181c20] tracking-tight">
              {formatMoney(
                recentPayments
                  .filter((payment) => payment.fiche_id === featuredFiches[0]?.id && payment.statut === "valide")
                  .reduce((sum, payment) => sum + payment.montant, 0),
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#777585] border-t border-[#eceef3]">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {featuredFiches[0]?.date_fin ? `Échéance : ${featuredFiches[0].date_fin}` : "Sans échéance"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#f1f4f9] font-bold text-[#181c20]">
              {featuredFiches[0]?.statut || "inactive"}
            </span>
          </div>
        </div>

        {/* White Floating Card 2: Projet École */}
        <div
          onClick={() => featuredFiches[1] && onOpenFicheDetail(featuredFiches[1].id)}
          className="lg:col-span-3 bg-white rounded-[32px] p-6 sm:p-7 flex flex-col justify-between shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] hover:shadow-[0_12px_32px_-4px_rgba(17,20,24,0.08)] cursor-pointer transition-all border border-transparent hover:border-secondary-container"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-secondary-container/30 flex items-center justify-center text-[#475e90]">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <span className="font-sora text-base text-[#181c20] font-bold">
                {featuredFiches[1]?.titre || "Aucune autre fiche"}
              </span>
            </div>
            <button type="button" className="text-[#777585] hover:text-[#181c20]">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>

          <div className="my-4">
            <div className="inline-block px-3 py-1 bg-[#e2dfff] text-primary font-bold rounded-full text-xs mb-2">
              {featuredFiches[1]?.type === "libre" ? "Collecte libre ouverte" : "Cotisation ouverte"}
            </div>
            <div className="text-sm text-[#464554]">
              {groups.find((group) => group.id === featuredFiches[1]?.group_id)?.name ||
                featuredFiches[1]?.motif ||
                "Aucune collecte active"}
            </div>
            <div className="font-sora text-2xl font-bold text-[#181c20] tracking-tight">
              {formatMoney(
                recentPayments
                  .filter((payment) => payment.fiche_id === featuredFiches[1]?.id && payment.statut === "valide")
                  .reduce((sum, payment) => sum + payment.montant, 0),
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#777585] border-t border-[#eceef3]">
            <span className="flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[15px] text-primary">volunteer_activism</span>
              {
                recentPayments.filter((payment) => payment.fiche_id === featuredFiches[1]?.id && payment.statut === "valide")
                  .length
              }{" "}
              paiement(s) validé(s)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
              {featuredFiches[1]?.statut || "inactive"}
            </span>
          </div>
        </div>
      </section>

      {/* Middle Row: Quick Contributors & Statistics Bar Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Contributors Capsule & Cycle in progress */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sora text-lg text-[#181c20] font-bold">Contributeurs récents</h2>
            <button
              type="button"
              onClick={() => onNavigateToView("groups")}
              className="text-xs text-primary hover:underline font-bold flex items-center gap-0.5"
            >
              <span>Tous</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Quick Transfer / Contributor horizontal capsule */}
          <div className="bg-white p-4 rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center gap-3.5 overflow-x-auto no-scrollbar border border-[#eceef3]">
            {/* Add Contributor Node */}
            <div onClick={onOpenRecordPayment} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
              <div className="w-13 h-13 rounded-full bg-[#111418] text-white flex items-center justify-center group-hover:scale-105 group-hover:bg-action-hover transition-all">
                <span className="material-symbols-outlined text-[20px]">add</span>
              </div>
              <span className="text-xs text-[#181c20] font-medium">Ajouter</span>
            </div>

            {/* Render top members */}
            {recentContributors.map((u) => {
              const hasCredit = u.solde_credit > 0;
              return (
                <div
                  key={u.id}
                  onClick={onOpenRecordPayment}
                  className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                  title={`${u.name} (Solde avance: ${formatMoney(u.solde_credit)})`}
                >
                  <div className="relative w-13 h-13">
                    <MemberAvatar
                      src={u.avatar}
                      name={u.name}
                      className="w-13 h-13 shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${hasCredit ? "bg-emerald-500" : "bg-amber-500"}`}
                      title={hasCredit ? "Crédit disponible" : "Aucun crédit"}
                    />
                  </div>
                  <span className="text-xs text-[#181c20] font-medium truncate max-w-[65px]">{u.name.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>

          {/* Cycle En Cours (Tour 4 sur 12 - Groupe Santé) */}
          <div className="bg-white p-6 rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center justify-between border border-[#eceef3]">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-primary font-bold uppercase tracking-wider">CYCLE EN COURS</span>
              <span className="font-sora text-base font-bold text-[#181c20]">
                {overview.fiches_obligatoires_count} fiche(s) obligatoire(s) active(s)
              </span>
              <p className="text-xs text-[#464554]">
                Membres inscrits : <strong className="text-[#181c20">{overview.cotisants_total_count}</strong>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  Collectif actif
                </span>
                <span className="text-xs text-[#777585]">{overview.cotisants_a_jour_count} cotisant(s) à jour</span>
              </div>
            </div>

            {/* Circular Gauge 75% */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#e0e2e7]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-primary-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${overview.cotisants_total_count > 0 ? Math.round((overview.cotisants_a_jour_count / overview.cotisants_total_count) * 100) : 0}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute font-sora text-sm font-bold text-[#181c20]">
                {overview.cotisants_total_count > 0
                  ? Math.round((overview.cotisants_a_jour_count / overview.cotisants_total_count) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Statistics Card matching Reference Right Card */}
        <div className="lg:col-span-7 bg-white rounded-[32px] p-6 sm:p-7 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] flex flex-col justify-between border border-[#eceef3]">
          {/* Header of statistics */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f1f4f9] flex items-center justify-center text-[#181c20]">
                <span className="material-symbols-outlined text-[18px]">query_stats</span>
              </div>
              <h2 className="font-sora text-lg text-[#181c20] font-bold">Statistiques de collecte</h2>
            </div>

            {/* Segmented Black Pod Switcher (Weekly/Monthly) + Action Icons */}
            <div className="flex items-center gap-2">
              <div className="bg-[#111418] p-1 rounded-full flex items-center text-white">
                <button
                  type="button"
                  onClick={() => setChartPeriod("weekly")}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    chartPeriod === "weekly" ? "bg-white text-[#111418] shadow-sm" : "text-white/70 hover:text-white"
                  }`}
                >
                  Hebdo
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod("monthly")}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    chartPeriod === "monthly" ? "bg-white text-[#111418] shadow-sm" : "text-white/70 hover:text-white"
                  }`}
                >
                  Mensuel
                </button>
              </div>

              <button
                type="button"
                className="w-9 h-9 rounded-full bg-[#f1f4f9] flex items-center justify-center text-[#777585] hover:bg-[#eceef3] transition-colors"
                title="Calendrier"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-[#111418] flex items-center justify-center text-white shadow-sm hover:bg-action-hover transition-colors"
                title="Analytique"
              >
                <span className="material-symbols-outlined text-[18px]">bar_chart</span>
              </button>
            </div>
          </div>

          {/* Amount Header + Trend */}
          <div className="flex items-baseline justify-between pt-6 pb-2">
            <div className="flex flex-col">
              <span className="font-sora text-3xl sm:text-4xl text-[#181c20] font-bold tracking-tight">
                {formatMoney(totalCollected)}
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                Montant total des paiements validés
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToView("versements")}
              className="flex items-center gap-1 text-[#777585] hover:text-[#181c20] text-xs font-bold"
            >
              <span>Détails</span>
              <span className="material-symbols-outlined text-[16px]">north_east</span>
            </button>
          </div>

          {/* Alternating Black and Periwinkle Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
              {chartData.map((bar, idx) => {
                const isBlack = idx % 2 === 1;
                return (
                  <div
                    key={bar.day}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
                  >
                    {/* Floating Tooltip */}
                    {hoveredBarIndex === idx && (
                      <div className="absolute -top-8 bg-[#111418] text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-20">
                        {bar.amount}
                      </div>
                    )}
                    <div
                      className={`w-full max-w-[28px] rounded-full transition-all duration-300 ${
                        isBlack
                          ? "bg-[#111418] group-hover:bg-action-hover"
                          : "bg-secondary-container group-hover:bg-primary-container"
                      }`}
                      style={{ height: `${bar.individual}%` }}
                    />
                    <span className="text-xs text-[#777585] font-medium">{bar.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Mini-cards KPI matching Income/Expenses capsules in reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#eceef3]">
            {/* KPI 1: Cotisations obligatoires */}
            <div className="bg-[#f1f4f9] p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#111418] text-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#777585]">Cotisations obligatoires</span>
                  <span className="font-sora text-sm text-[#181c20] font-bold">
                    {formatMoney(collectedForFiches(mandatoryFiches))}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {mandatoryFiches.length} fiche(s)
              </span>
            </div>

            {/* KPI 2: Dons libres */}
            <div className="bg-[#f1f4f9] p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary-container text-[#001943] flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#777585]">Dons libres</span>
                  <span className="font-sora text-sm text-[#181c20] font-bold">
                    {formatMoney(collectedForFiches(freeFiches))}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {freeFiches.length} collecte(s)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Transactions & Cotisations List */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-sora text-lg text-[#181c20] font-bold">Dernières transactions &amp; Cotisations</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#e0e2e7] text-[#464554] text-xs font-bold">
              {filteredPayments.length} enregistrées
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pill */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#e0e2e7]/80 shadow-sm text-xs">
              <button
                type="button"
                onClick={() => setSelectedGroupFilter("all")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  selectedGroupFilter === "all" ? "bg-[#181c20] text-white" : "text-[#464554] hover:text-[#181c20]"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroupFilter(groups[0]?.id || "groupes")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  selectedGroupFilter === (groups[0]?.id || "groupes")
                    ? "bg-[#181c20] text-white"
                    : "text-[#464554] hover:text-[#181c20]"
                }`}
              >
                {groups[0]?.name || "Groupes"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroupFilter("libre")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  selectedGroupFilter === "libre" ? "bg-[#181c20] text-white" : "text-[#464554] hover:text-[#181c20]"
                }`}
              >
                Dons Libres
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-1.5 rounded-full bg-action hover:bg-action-hover text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Capsule List of Transactions */}
        <div className="bg-white rounded-[32px] p-4 sm:p-6 shadow-[0_8px_24px_-4px_rgba(17,20,24,0.04)] flex flex-col gap-2 border border-[#eceef3]">
          {filteredPayments.map((p) => {
            const user = users.find((u) => u.id === p.user_id);
            const fiche = fiches.find((item) => item.id === p.fiche_id);
            const group = groups.find((item) => item.id === fiche?.group_id);
            const displayName = p.is_anonymous ? "Don Anonyme" : user?.name || p.nom_donateur_libre || "Contributeur";
            const isDon = fiche?.type === "libre";
            const statusLabel = p.statut === "valide" ? "Validé" : p.statut === "en_attente" ? "En attente" : "Échoué";

            return (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 hover:bg-[#f1f4f9]/70 rounded-2xl transition-all group gap-3"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      isDon ? "bg-secondary-container/40 text-[#475e90]" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={isDon ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {isDon ? "volunteer_activism" : "payments"}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#181c20] group-hover:text-primary transition-colors">
                        {displayName} — {p.fiche_titre || "Contribution"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#777585] mt-0.5">
                      <span>{group?.name || fiche?.categorie || fiche?.motif || "Contribution"}</span>
                      <span>•</span>
                      <span>{p.date}</span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${p.statut === "valide" ? "bg-emerald-100 text-emerald-800" : p.statut === "en_attente" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}
                      >
                        {statusLabel}
                      </span>
                      {isDon && (
                        <span className="px-2 py-0.2 rounded-full bg-[#e2dfff] text-primary text-[10px] font-bold">
                          Don Libre
                        </span>
                      )}
                      {p.allocation && p.allocation.credite_solde > 0 && (
                        <span className="px-2 py-0.2 rounded-full bg-[#d9e2ff] text-[#001943] text-[10px] font-semibold">
                          +{formatMoney(p.allocation.credite_solde)} solde d'avance
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-14 sm:pl-0">
                  <span className="font-sora text-sm sm:text-base font-bold text-emerald-600">+{formatMoney(p.montant)}</span>
                  <MobileMoneyBadge provider={p.mobile_provider} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
