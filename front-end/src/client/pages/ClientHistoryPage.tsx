import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/authContext";
import { mockApi } from "../../services/mockApi";
import { Payment } from "../../types";
import { formatMoney } from "../../config/currency";

export const ClientHistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allPayments = await mockApi.getPayments();
        if (currentUser) {
          const userPayments = allPayments.filter((p) => p.user_id === currentUser.id);
          setPayments(userPayments);
        }
      } catch (err) {
        console.error("Failed to load payments", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const totalPaid = payments.reduce((acc, p) => acc + p.montant, 0);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-4 right-4 z-50 max-w-md mx-auto bg-[#111418] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between border border-secondary-container/30 text-xs font-semibold animate-bounce">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Navigation bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/client/profil")}
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-container transition-colors py-1 px-2 rounded-lg hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Retour au Profil</span>
        </button>

        <span className="text-[11px] font-bold text-[#777585] uppercase tracking-wider">Historique</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-xs border border-[#eceef3] flex items-center justify-between">
        <div>
          <h1 className="font-sora text-base font-bold text-[#181c20]">Historique de vos versements</h1>
          <p className="text-xs text-[#777585] mt-0.5">
            {payments.length} transaction{payments.length > 1 ? "s" : ""} enregistrée{payments.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#777585] uppercase font-bold block">Cumul versé</span>
          <span className="font-sora font-bold text-base text-emerald-700">{formatMoney(totalPaid)}</span>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="bg-white p-6 rounded-[24px] text-center border border-[#eceef3] text-xs text-[#777585]">
          <span className="material-symbols-outlined text-[36px] text-secondary-container block mb-2">receipt</span>
          Aucun versement n'a encore été enregistré pour votre compte.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-2xl border border-[#eceef3] shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-sora text-xs font-bold text-[#181c20] truncate">
                    {p.fiche_titre || "Cotisation collective"}
                  </h2>
                  <p className="text-[10px] text-[#777585] mt-0.5">
                    {p.date} · Réf: <span className="font-mono font-semibold">{p.reference}</span>
                  </p>
                  {p.mobile_provider && (
                    <span className="text-[10px] text-primary font-semibold block capitalize">
                      {p.mobile_provider.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span
                  className={`font-sora font-bold text-sm ${p.statut === "valide" ? "text-emerald-700" : p.statut === "en_attente" ? "text-amber-700" : "text-red-600"}`}
                >
                  +{formatMoney(p.montant)}
                </span>
                <span
                  className={`text-[10px] font-semibold ${p.statut === "valide" ? "text-emerald-700" : p.statut === "en_attente" ? "text-amber-700" : "text-red-600"}`}
                >
                  {p.statut === "valide" ? "Confirmé" : p.statut === "en_attente" ? "En attente" : "Échoué"}
                </span>
                <button
                  type="button"
                  onClick={() => showToast(`Reçu officiel #${p.reference} généré et téléchargé.`)}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <span className="material-symbols-outlined text-[12px]">download</span>
                  <span>Reçu PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action link */}
      <Link
        to="/client/dashboard"
        className="w-full py-3 rounded-full bg-action hover:bg-action-hover text-white font-sora font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
      >
        <span className="material-symbols-outlined text-[16px]">payments</span>
        <span>Accéder à mes cotisations</span>
      </Link>
    </div>
  );
};
