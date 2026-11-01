import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockApi } from "../../services/mockApi";
import { FicheContribution, Payment, PublicPortalSettings, MobileMoneyProvider } from "../../types";
import { PublicDonationModal } from "../components/PublicDonationModal";
import { APP_NAME } from "../../config/branding";
import { Button, Spinner } from "../../components/ui";
import { formatMoney } from "../../config/currency";

export const PublicHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [fiches, setFiches] = useState<FicheContribution[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<PublicPortalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "libre" | "obligatoire">("all");
  const [selectedDonationFiche, setSelectedDonationFiche] = useState<FicheContribution | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async () => {
    try {
      const [f, p, s] = await Promise.all([mockApi.getPublicFiches(), mockApi.getPayments(), mockApi.getPublicSettings()]);
      setFiches(f);
      setPayments(p);
      setSettings(s);
    } catch (err) {
      console.error("Public portal load error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordDonation = async (payload: {
    fiche_id: string;
    montant: number;
    mobile_provider: MobileMoneyProvider;
    nom_donateur_libre?: string;
    phone_number?: string;
    is_anonymous: boolean;
  }) => {
    const result = await mockApi.recordPayment({
      fiche_id: payload.fiche_id,
      user_id: null,
      nom_donateur_libre: payload.nom_donateur_libre,
      is_anonymous: payload.is_anonymous,
      montant: payload.montant,
      mobile_provider: payload.mobile_provider,
      phone_number: payload.phone_number,
      note: payload.is_anonymous ? "Contribution publique anonyme" : `Don public (${payload.nom_donateur_libre})`,
    });
    await loadData();
    return result;
  };

  // Compute stats per fiche
  const getFicheStats = (fiche: FicheContribution) => {
    const fichePayments = payments.filter((p) => p.fiche_id === fiche.id && p.statut === "valide");
    const totalCollected = fichePayments.reduce((acc, p) => acc + p.montant, 0);
    const target = fiche.cagnotte_cible || (fiche.montant_impose ? fiche.montant_impose * 24 : 1000);
    const percent = Math.min(100, Math.round((totalCollected / target) * 100));
    const donorCount = fichePayments.length;
    return { totalCollected, target, percent, donorCount };
  };

  const filteredFiches = fiches.filter((f) => {
    if (activeFilter === "all") return true;
    return f.type === activeFilter;
  });

  const totalCollectedAll = payments.filter((p) => p.statut === "valide").reduce((sum, p) => sum + p.montant, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#111418] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-secondary-container/30 text-xs font-semibold animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white ml-2">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Donation Modal */}
      <PublicDonationModal
        isOpen={!!selectedDonationFiche}
        fiche={selectedDonationFiche}
        onClose={() => setSelectedDonationFiche(null)}
        onConfirmDonation={handleRecordDonation}
        onShowToast={showToast}
      />

      {/* Simple, understated Hero / Presentation */}
      <section className="bg-white rounded-[28px] p-5 sm:p-8 border border-[#eceef3] shadow-xs flex flex-col gap-5">
        <div className="flex flex-col gap-2 max-w-2xl">
          <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider">
            {settings?.nom_collectif || `${APP_NAME} Collectif`}
          </span>
          <h1 className="font-sora text-2xl sm:text-3xl font-bold text-[#181c20] tracking-tight">
            Collectes solidaires & fiches de contribution
          </h1>
          <p className="text-xs sm:text-sm text-[#464554] leading-relaxed">
            {settings?.message_bienvenue ||
              "Retrouvez en toute transparence nos collectes ouvertes à tous. Chaque fiche présente précisément le motif, l'objectif financier et l'impact pour notre communauté. Vous pouvez y contribuer librement et sans inscription via Mobile Money."}
          </p>
        </div>

        {/* Minimalist Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#eceef3]">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#777585]">Collectes actives</span>
            <span className="font-sora text-xl font-bold text-[#181c20]">{fiches.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#777585]">Total mobilisé</span>
            <span className="font-mono text-xl font-bold text-emerald-700">{formatMoney(totalCollectedAll)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#777585]">Transparence</span>
            <span className="font-sora text-sm font-bold text-primary flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              100% traçable
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#777585]">Mobile Money</span>
            <span className="text-xs font-semibold text-[#181c20] mt-1">Orange, Wave, M-Pesa...</span>
          </div>
        </div>
      </section>

      {/* Filter and Content Header */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-sora text-lg font-bold text-[#181c20]">Fiches ouvertes au public</h2>
            <span className="text-xs font-bold text-[#777585] bg-[#eceef3] px-2 py-0.5 rounded-full">
              {filteredFiches.length}
            </span>
          </div>

          {/* Simple Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#eceef3]/70 p-1 rounded-full text-xs self-start">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-full transition-all font-semibold ${
                activeFilter === "all" ? "bg-white text-[#181c20] shadow-xs" : "text-[#777585] hover:text-[#181c20]"
              }`}
            >
              Toutes ({fiches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("libre")}
              className={`px-3 py-1 rounded-full transition-all font-semibold ${
                activeFilter === "libre" ? "bg-white text-[#181c20] shadow-xs" : "text-[#777585] hover:text-[#181c20]"
              }`}
            >
              Dons libres ({fiches.filter((f) => f.type === "libre").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("obligatoire")}
              className={`px-3 py-1 rounded-full transition-all font-semibold ${
                activeFilter === "obligatoire" ? "bg-white text-[#181c20] shadow-xs" : "text-[#777585] hover:text-[#181c20]"
              }`}
            >
              Projets collectifs ({fiches.filter((f) => f.type === "obligatoire").length})
            </button>
          </div>
        </div>

        {/* Fiches Cards Grid */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner className="w-8 h-8 border-3" />
            <span className="text-xs text-[#777585]">Chargement des collectes publiques...</span>
          </div>
        ) : filteredFiches.length === 0 ? (
          <div className="bg-white rounded-[24px] p-6 text-center border border-[#eceef3] text-xs text-[#777585]">
            Aucune fiche de collecte publique disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFiches.map((fiche) => {
              const { totalCollected, target, percent, donorCount } = getFicheStats(fiche);

              return (
                <article
                  key={fiche.id}
                  className="bg-white rounded-[28px] p-6 border border-[#eceef3] hover:border-secondary-container shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
                >
                  {/* Card Header */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {fiche.code}
                        </span>
                        {fiche.categorie && (
                          <span className="text-[10px] font-semibold text-[#777585]">{fiche.categorie}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {fiche.type === "libre" ? "Don Libre" : "Ouvert à tous"}
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/fiche/${fiche.id}`)}
                      className="font-sora text-base font-bold text-[#181c20] group-hover:text-primary transition-colors cursor-pointer"
                    >
                      {fiche.titre}
                    </h3>

                    {/* Explicative presentation teaser */}
                    <p className="text-xs text-[#464554] leading-relaxed line-clamp-3">{fiche.description || fiche.motif}</p>

                    {fiche.beneficiaire && (
                      <div className="flex items-center gap-1 text-[11px] text-[#777585] mt-1">
                        <span className="material-symbols-outlined text-[15px] text-primary">handshake</span>
                        <span>
                          Bénéficiaire : <strong>{fiche.beneficiaire}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Progress */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-[#eceef3]">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-sm text-[#181c20]">{formatMoney(totalCollected)}</span>
                        <span className="text-[#777585] text-[11px]"> récoltés sur {formatMoney(target)}</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-primary">{percent}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-[#f1f4f9] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#777585]">
                      <span>
                        {donorCount} contribution{donorCount > 1 ? "s" : ""}
                      </span>
                      <span>{fiche.date_fin ? `Fin le ${fiche.date_fin}` : "Collecte permanente"}</span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/fiche/${fiche.id}`)}
                      className="flex-1 py-2 px-3 rounded-full border border-[#e0e2e7] hover:border-primary hover:text-primary text-xs font-semibold text-[#464554] transition-all text-center flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">info</span>
                      <span>Lire la présentation</span>
                    </button>

                    <Button type="button" onClick={() => setSelectedDonationFiche(fiche)} size="sm">
                      <span className="material-symbols-outlined text-[15px]">volunteer_activism</span>
                      <span>Contribuer</span>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
