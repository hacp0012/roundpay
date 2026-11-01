import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { mockApi } from "../../services/mockApi";
import { FicheContribution, Payment, MobileMoneyProvider } from "../../types";
import { PublicDonationModal } from "../components/PublicDonationModal";
import { MobileMoneyBadge } from "../../components/common/MobileMoneyBadges";
import { Button, Spinner } from "../../components/ui";
import { formatMoney } from "../../config/currency";

export const PublicFicheDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fiche, setFiche] = useState<FicheContribution | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async () => {
    if (!id) return;
    try {
      const [f, p] = await Promise.all([mockApi.getFicheById(id), mockApi.getPaymentsForFiche(id)]);
      setFiche(f);
      setPayments(p);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

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

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner className="w-8 h-8 border-3" />
        <span className="text-xs text-[#777585]">Chargement de la fiche de collecte...</span>
      </div>
    );
  }

  if (!fiche) {
    return (
      <div className="bg-white rounded-[28px] p-6 text-center border border-[#eceef3] max-w-md mx-auto my-8 flex flex-col gap-4">
        <span className="material-symbols-outlined text-[40px] text-[#777585]">search_off</span>
        <h2 className="font-sora text-lg font-bold text-[#181c20]">Fiche introuvable ou fermée</h2>
        <p className="text-xs text-[#777585]">La fiche demandée n'existe pas ou n'est plus accessible publiquement.</p>
        <Link to="/" className="py-2.5 px-6 rounded-full bg-primary text-white text-xs font-bold inline-block self-center">
          Retour aux collectes publiques
        </Link>
      </div>
    );
  }

  const totalCollected = payments.reduce((sum, p) => sum + p.montant, 0);
  const target = fiche.cagnotte_cible || (fiche.montant_impose ? fiche.montant_impose * 24 : 1000);
  const percent = Math.min(100, Math.round((totalCollected / target) * 100));
  const remaining = Math.max(0, target - totalCollected);

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#111418] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-secondary-container/30 text-xs font-semibold">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <PublicDonationModal
        isOpen={isDonationModalOpen}
        fiche={fiche}
        onClose={() => setIsDonationModalOpen(false)}
        onConfirmDonation={handleRecordDonation}
        onShowToast={showToast}
      />

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-xs font-semibold text-[#777585] hover:text-[#181c20] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Retour aux collectes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            showToast("Lien de la fiche copié dans le presse-papier !");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e0e2e7] text-[11px] font-bold text-[#464554] hover:bg-white transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">share</span>
          <span>Partager la fiche</span>
        </button>
      </div>

      {/* Main Presentation Container */}
      <article className="bg-white rounded-[28px] p-5 sm:p-8 border border-[#eceef3] shadow-xs flex flex-col gap-6">
        {/* Header Badges & Titles */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {fiche.code}
            </span>
            {fiche.categorie && (
              <span className="text-xs font-bold text-[#464554] bg-[#f1f4f9] px-3 py-1 rounded-full">{fiche.categorie}</span>
            )}
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Collecte Publique Ouverte
            </span>
          </div>

          <h1 className="font-sora text-2xl sm:text-3xl font-bold text-[#181c20] leading-tight">{fiche.titre}</h1>

          <p className="text-xs sm:text-sm text-[#464554] font-medium leading-relaxed bg-[#f7f9fe] p-4 rounded-2xl border border-[#eceef3]">
            {fiche.motif}
          </p>
        </div>

        {/* Financial Progress & Direct Action */}
        <div className="p-6 rounded-3xl bg-[#f7f9fe] border border-[#eceef3] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-[#777585] block uppercase tracking-wider">État de la cagnotte</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-bold text-2xl sm:text-3xl text-emerald-700">
                  {formatMoney(totalCollected)}
                </span>
                <span className="text-xs text-[#777585]">
                  collectés sur un objectif de <strong>{formatMoney(target)}</strong>
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setIsDonationModalOpen(true)}
              size="lg"
              className="self-start sm:self-auto shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
              <span>Faire une contribution</span>
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="w-full h-3 rounded-full bg-[#e0e2e7] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-600 rounded-full transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#777585]">
              <span>{percent}% de l'objectif atteint</span>
              <span>Reste à collecter : {formatMoney(remaining)}</span>
            </div>
          </div>
        </div>

        {/* Detailed Presentation Section: Explains the reason for contribution */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#eceef3] pb-2">
            <span className="material-symbols-outlined text-[20px] text-primary">description</span>
            <h2 className="font-sora text-base font-bold text-[#181c20]">
              Présentation explicative & Pourquoi nous cotisons
            </h2>
          </div>

          <div className="text-xs sm:text-sm text-[#181c20] leading-relaxed flex flex-col gap-3 font-normal">
            <p>
              {fiche.description ||
                "Cette fiche d'engagement collectif a été créée pour mobiliser notre communauté autour d'un besoin concret et validé par les membres. Votre participation permet de concrétiser cette action sans intermédiaire et avec une reddition des comptes transparente."}
            </p>

            {fiche.beneficiaire && (
              <div className="mt-2 p-4 rounded-2xl bg-white border border-[#eceef3] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#777585] block">Projet & Bénéficiaire direct :</span>
                  <span className="text-xs font-bold text-[#181c20]">{fiche.beneficiaire}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Transparency List: Recent contributions */}
        <section className="flex flex-col gap-4 pt-4 border-t border-[#eceef3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">history</span>
              <h2 className="font-sora text-base font-bold text-[#181c20]">Contributions enregistrées ({payments.length})</h2>
            </div>
            <span className="text-[11px] text-[#777585]">Transparence publique</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#f7f9fe] text-center text-xs text-[#777585]">
              Soyez le premier à soutenir cette collecte solidaire !
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#eceef3] border border-[#eceef3] rounded-2xl overflow-hidden">
              {payments.map((p) => {
                const displayName = p.is_anonymous ? "Donateur anonyme" : p.nom_donateur_libre || "Bienfaiteur";

                return (
                  <div key={p.id} className="p-3.5 bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f1f4f9] text-[#464554] flex items-center justify-center font-bold text-xs">
                        {p.is_anonymous ? "?" : displayName[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#181c20]">{displayName}</span>
                        <span className="text-[10px] text-[#777585]">
                          {p.date} •{" "}
                          {p.mobile_provider ? <MobileMoneyBadge provider={p.mobile_provider} size="sm" /> : "Versement"}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      +{formatMoney(p.montant)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </article>
    </div>
  );
};
