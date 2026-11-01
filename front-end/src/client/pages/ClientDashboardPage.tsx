import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/authContext";
import { mockApi } from "../../services/mockApi";
import { User, FicheContribution, MemberFicheRecord, Payment, MobileMoneyProvider } from "../../types";
import { ContributorMobileView } from "../../components/contributor/ContributorMobileView";
import { Spinner } from "../../components/ui";
import { formatMoney } from "../../config/currency";

export const ClientDashboardPage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [fiches, setFiches] = useState<FicheContribution[]>([]);
  const [records, setRecords] = useState<Record<string, MemberFicheRecord[]>>({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = async () => {
    try {
      const [u, f, p] = await Promise.all([mockApi.getUsers(), mockApi.getFiches(), mockApi.getPayments()]);

      setUsers(u);
      const openFiches = f.filter((fiche) => fiche.statut === "ouverte");
      setFiches(openFiches);
      setPayments(p);

      const recordEntries = await Promise.all(
        openFiches.map(async (fiche) => [
          fiche.id,
          await mockApi.getMemberRecordsForFiche(fiche.id),
        ] as const),
      );
      const recMap = Object.fromEntries(recordEntries);
      setRecords(recMap);
      // Refresh currentUser if balance changed
      if (currentUser) {
        const freshUser = u.find((usr) => usr.id === currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    } catch (err) {
      console.error("Client dashboard data loading failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (payload: {
    fiche_id: string;
    user_id: string | null;
    nom_donateur_libre?: string;
    is_anonymous?: boolean;
    montant: number;
    mobile_provider: MobileMoneyProvider;
    phone_number?: string;
    note?: string;
  }) => {
    const result = await mockApi.recordPayment({
      fiche_id: payload.fiche_id,
      user_id: payload.user_id || currentUser?.id || "user-amadou",
      is_anonymous: payload.is_anonymous || false,
      montant: payload.montant,
      mobile_provider: payload.mobile_provider,
      phone_number: payload.phone_number || currentUser?.phone,
      note: payload.note,
    });
    await loadData();
    return result;
  };

  const handleUseCredit = async (user_id: string, fiche_id: string, amount: number) => {
    await mockApi.useCreditWallet(user_id, fiche_id, amount);
    await loadData();
    showToast(`${formatMoney(amount)} imputés depuis votre portefeuille d'avance !`);
  };

  if (isLoading || !currentUser) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner className="w-8 h-8 border-3" />
        <span className="text-xs font-semibold text-[#777585]">Actualisation de vos fiches...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
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

      {/* Contributor Mobile Experience (No artificial card wrapper) */}
      <ContributorMobileView
        currentUser={currentUser}
        fiches={fiches}
        records={records}
        payments={payments}
        onRecordPayment={handleRecordPayment}
        onUseCredit={handleUseCredit}
        onShowToast={showToast}
      />
    </div>
  );
};
