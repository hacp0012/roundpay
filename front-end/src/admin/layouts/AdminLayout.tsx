import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../services/authContext";
import { mockApi } from "../../services/mockApi";
import {
  User,
  Group,
  FicheContribution,
  MemberFicheRecord,
  Payment,
  DepenseProjet,
  TreasuryOverview,
  MobileMoneyProvider,
  FicheType,
} from "../../types";
import { RoundPayLogo } from "../../components/common/RoundPayLogo";
import { PWAInstallButton } from "../../components/common/PWAInstallButton";
import { OfflineIndicator } from "../../components/common/OfflineIndicator";
import { PaymentModal } from "../../components/modals/PaymentModal";
import { AddMemberModal } from "../../components/modals/AddMemberModal";
import { useModalHistory } from "../../hooks/useModalHistory";

// Admin views
import { DashboardView } from "../../components/admin/DashboardView";
import { GroupsView } from "../../components/admin/GroupsView";
import { FichesView } from "../../components/admin/FichesView";
import { FichesArchiveView } from "../../components/admin/FichesArchiveView";
import { AdminsView } from "../../components/admin/AdminsView";
import { FicheDetailView } from "../../components/admin/FicheDetailView";
import { VersementsView } from "../../components/admin/VersementsView";
import { DepensesView } from "../../components/admin/DepensesView";
import { CollectesView } from "../../components/admin/CollectesView";
import { AdminMembersPage } from "../pages/AdminMembersPage";
import { AdminPortalSettingsView } from "../../components/admin/AdminPortalSettingsView";
import { AdminSettingsView } from "../../components/admin/AdminSettingsView";
import { APP_NAME } from "../../config/branding";
import { Button, Spinner } from "../../components/ui";
import { MemberAvatar } from "../../components/common/MemberAvatar";
import { formatMoney, isAppCurrency, setAppCurrency } from "../../config/currency";

export const AdminLayout: React.FC = () => {
  const { currentUser, role, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLargeScreen, setIsLargeScreen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [fiches, setFiches] = useState<FicheContribution[]>([]);
  const [records, setRecords] = useState<Record<string, MemberFicheRecord[]>>({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const [depenses, setDepenses] = useState<DepenseProjet[]>([]);
  const [overview, setOverview] = useState<TreasuryOverview | null>(null);
  const [activeFicheId, setActiveFicheId] = useState<string>("fiche-1");
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useModalHistory({
    isOpen: isMobileMenuOpen,
    onClose: () => setIsMobileMenuOpen(false),
    modalId: "admin-mobile-menu",
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateScreenSize = () => setIsLargeScreen(mediaQuery.matches);

    updateScreenSize();
    mediaQuery.addEventListener("change", updateScreenSize);
    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  // Check auth
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || role !== "admin") {
        navigate("/admin/login", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, role, navigate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const refreshData = async () => {
    try {
      const [u, g, f, p, d, ov, settings] = await Promise.all([
        mockApi.getUsers(),
        mockApi.getGroups(),
        mockApi.getFiches(),
        mockApi.getPayments(),
        mockApi.getDepenses(),
        mockApi.getTreasuryOverview(),
        mockApi.getPublicSettings(),
      ]);

      if (isAppCurrency(settings.devise)) {
        setAppCurrency(settings.devise);
      }

      setUsers(u);
      setGroups(g);
      setFiches(f);
      setPayments(p);
      setDepenses(d);
      setOverview(ov);

      const recordEntries = await Promise.all(
        f.map(async (fiche) => [
          fiche.id,
          await mockApi.getMemberRecordsForFiche(fiche.id),
        ] as const),
      );
      const recMap = Object.fromEntries(recordEntries);
      setRecords(recMap);
    } catch (err) {
      console.error("Data refresh failed", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isLargeScreen) {
      refreshData();
    } else {
      setIsDataLoading(false);
    }
  }, [isLargeScreen]);

  // Determine current active subview from URL path
  const currentPath = location.pathname;
  let currentAdminTab = "dashboard";
  if (currentPath.includes("/admin/members")) currentAdminTab = "members";
  else if (currentPath.includes("/admin/groups")) currentAdminTab = "groups";
  else if (currentPath.includes("/admin/fiches/archives")) currentAdminTab = "fiches_archives";
  else if (currentPath.includes("/admin/fiches")) currentAdminTab = "fiches";
  else if (currentPath.includes("/admin/fiche-detail")) currentAdminTab = "fiche_detail";
  else if (currentPath.includes("/admin/versements")) currentAdminTab = "versements";
  else if (currentPath.includes("/admin/depenses")) currentAdminTab = "depenses";
  else if (currentPath.includes("/admin/collectes")) currentAdminTab = "collectes";
  else if (currentPath.includes("/admin/portal")) currentAdminTab = "portal";
  else if (currentPath.includes("/admin/settings")) currentAdminTab = "settings";
  else if (currentPath.includes("/admin/administrateurs")) currentAdminTab = "admins";

  const handleNavigate = (tab: string) => {
    setIsMobileMenuOpen(false);
    if (tab === "dashboard") navigate("/admin/dashboard");
    else if (tab === "members") navigate("/admin/members");
    else if (tab === "groups") navigate("/admin/groups");
    else if (tab === "fiches") navigate("/admin/fiches");
    else if (tab === "fiches_archives") navigate("/admin/fiches/archives");
    else if (tab === "fiche_detail") navigate("/admin/fiche-detail");
    else if (tab === "versements") navigate("/admin/versements");
    else if (tab === "depenses") navigate("/admin/depenses");
    else if (tab === "collectes") navigate("/admin/collectes");
    else if (tab === "portal") navigate("/admin/portal");
    else if (tab === "settings") navigate("/admin/settings");
    else if (tab === "admins") navigate("/admin/administrateurs");
  };

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
      user_id: payload.user_id,
      is_anonymous: payload.is_anonymous || false,
      montant: payload.montant,
      mobile_provider: payload.mobile_provider,
      phone_number: payload.phone_number || users.find((user) => user.id === payload.user_id)?.phone,
      note: payload.note,
    });
    await refreshData();
    return result;
  };

  const handleCreateFiche = async (data: {
    titre: string;
    motif: string;
    type: FicheType;
    group_id: string | null;
    montant_impose: number | null;
    cagnotte_cible?: number;
    date_debut: string;
    date_fin: string | null;
  }) => {
    const newFiche = await mockApi.createFiche(data);
    await refreshData();
    setActiveFicheId(newFiche.id);
    navigate("/admin/fiche-detail");
    showToast(`Fiche "${newFiche.titre}" créée avec succès !`);
  };

  const handleUpdateFiche = async (ficheId: string, updates: Partial<FicheContribution>) => {
    const updatedFiche = await mockApi.updateFiche(ficheId, updates);
    if (!updatedFiche) {
      throw new Error("Fiche introuvable.");
    }
    await refreshData();
  };

  const handleAddMember = async (data: {
    name: string;
    phone: string;
    pin: string;
    email?: string;
    solde_credit?: number;
    group_ids?: string[];
  }) => {
    await mockApi.addMember(data);
    await refreshData();
  };

  const handleUpdateMemberPin = async (userId: string, newPin: string) => {
    await mockApi.updateMemberPin(userId, newPin);
    await refreshData();
  };

  const handleUpdateMember = async (userId: string, data: Partial<User>) => {
    await mockApi.updateMember(userId, data);
    await refreshData();
  };

  const handleCreateGroup = async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    periodicite?: string;
  }) => {
    await mockApi.createGroup(data);
    await refreshData();
  };

  const handleUpdateGroup = async (
    groupId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      periodicite?: string;
    },
  ) => {
    await mockApi.updateGroup(groupId, data);
    await refreshData();
  };

  const handleDeleteGroup = async (groupId: string) => {
    await mockApi.deleteGroup(groupId);
    await refreshData();
  };

  const handleAddMemberToGroup = async (groupId: string, userId: string) => {
    await mockApi.addMemberToGroup(groupId, userId);
    await refreshData();
  };

  const handleRemoveMemberFromGroup = async (groupId: string, userId: string) => {
    await mockApi.removeMemberFromGroup(groupId, userId);
    await refreshData();
  };

  const handleUseCredit = async (user_id: string, fiche_id: string, amount: number) => {
    await mockApi.useCreditWallet(user_id, fiche_id, amount);
    await refreshData();
    showToast(`${formatMoney(amount)} prélevés du solde d'avance avec succès !`);
  };

  const handleAddDepense = async (data: {
    titre: string;
    montant: number;
    categorie: string;
    description: string;
    cree_par: string;
  }) => {
    await mockApi.addDepense(data);
    await refreshData();
    showToast(`Dépense de ${formatMoney(data.montant)} enregistrée.`);
  };

  const handleResetData = () => {
    mockApi.resetToDefault();
    refreshData();
    showToast("Données réinitialisées avec succès.");
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (!isLargeScreen) {
    return (
      <div className="min-h-screen bg-[#f7f9fe] px-4 flex items-center justify-center text-on-surface">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm border border-[#eceef3]">
          <span className="material-symbols-outlined text-3xl text-primary">desktop_windows</span>
          <h1 className="mt-3 font-sora text-lg font-bold">Administration indisponible sur téléphone</h1>
          <p className="mt-2 text-sm text-[#464554]">
            Utilisez une tablette ou un ordinateur avec un écran d’au moins 768 pixels de largeur pour accéder à
            l’administration.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading || isDataLoading || !overview) {
    return (
      <div className="min-h-screen bg-[#f7f9fe] flex flex-col items-center justify-center gap-4 text-on-surface">
        <Spinner size="lg" />
        <span className="font-sora text-sm font-semibold">Chargement de l'administration {APP_NAME}...</span>
      </div>
    );
  }

  const activeFiche = fiches.find((f) => f.id === activeFicheId) || fiches[0];
  const activeRecords = records[activeFiche?.id] || [];

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: "grid_view" },
    { id: "members", label: "Membres & Inscriptions", icon: "group", badge: users.filter((u) => u.is_member).length },
    { id: "groups", label: "Groupes & Tontines", icon: "account_balance_wallet" },
    {
      id: "fiches",
      label: "Fiches de cotisation",
      icon: "description" /* badge: fiches.filter((f) => f.is_public).length */,
    },
    { id: "versements", label: "Versements & Crédits", icon: "sync_alt" },
    { id: "depenses", label: "Dépenses & Caisse", icon: "receipt_long" },
    { id: "collectes", label: "Collectes libres & Dons", icon: "volunteer_activism" },
    { id: "portal", label: "Portail Public & Contact", icon: "public" },
    ...(currentUser?.is_principal
      ? [{ id: "admins", label: "Administrateurs", icon: "admin_panel_settings" }]
      : []),
    { id: "settings", label: "Paramètres", icon: "settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fe] text-on-surface relative flex flex-col lg:flex-row">
      <OfflineIndicator />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-action text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-secondary-container/30 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white ml-2">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        fiches={fiches}
        users={users}
        records={records}
        onRecordPayment={handleRecordPayment}
        onShowToast={showToast}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        groups={groups}
        onAddMember={handleAddMember}
        onShowToast={showToast}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-3 top-3 bottom-3 w-64 bg-secondary-container rounded-[24px] shadow-[0_16px_36px_-12px_rgb(var(--app-color-rgb)/0.12)] z-40 flex-col p-3 justify-between transition-all">
        <div className="flex flex-col gap-5">
          {/* Header Logo */}
          <div className="flex items-center justify-between px-2 pt-1">
            <RoundPayLogo textColor="text-[#001943]" size="md" />
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                currentAdminTab === item.id ||
                (item.id === "fiches" && (currentAdminTab === "fiche_detail" || currentAdminTab === "fiches_archives"));

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-sm text-left ${
                    isActive
                      ? "bg-on-surface text-white font-semibold shadow-md"
                      : "text-on-secondary-fixed-variant hover:bg-white/50 hover:text-on-surface font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-[#001943]/10 text-[#001943]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status Capsule */}
        <div className="p-3 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-white/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-semibold text-on-secondary-container">Caisse collective active</span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-secondary-container">shield</span>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 min-w-0 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 bg-[#f7f9fe]/90 backdrop-blur-xl z-30 px-3 sm:px-6 py-3 flex items-center justify-between border-b border-surface-container/80 gap-2">
          {/* Mobile menu hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-white border border-surface-container-highest text-on-surface"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <RoundPayLogo size="sm" />
          </div>

          {/* Search Bar */}
          <div className="hidden sm:flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777585] text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Rechercher membre, groupe, fiche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs text-on-surface placeholder:text-[#777585] shadow-xs border border-surface-container-highest focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton />

            {/* Quick Add Member Button (Explicit User Requirement) */}
            <Button type="button" id="btn-header-add-member" onClick={() => setIsAddMemberModalOpen(true)} size="sm">
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span className="hidden sm:inline">Ajouter membre</span>
            </Button>

            {/* Admin User Badge + Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-surface-container-highest">
              <button
                type="button"
                onClick={() => handleNavigate("settings")}
                className="flex items-center gap-2 rounded-full hover:bg-[#f7f9fe] pr-2 transition-colors"
                title="Modifier mon profil"
              >
                <MemberAvatar
                  src={null}
                  name={currentUser?.name || "Admin"}
                  className="w-8 h-8 border border-surface-container-highest"
                />
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-on-surface leading-none">{currentUser?.name || "Sophie M."}</div>
                  <span className="text-[10px] text-[#777585]">Trésorerie</span>
                </div>
              </button>
              <button
                type="button"
                id="btn-admin-logout"
                onClick={handleLogout}
                title="Se déconnecter de l'administration"
                className="p-1.5 text-[#777585] hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
            <div className="w-72 bg-secondary-container p-5 flex flex-col justify-between h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <RoundPayLogo textColor="text-[#001943]" size="md" />
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-full text-[#001943] hover:bg-white/40"
                  >
                    <span className="material-symbols-outlined text-[22px]">close</span>
                  </button>
                </div>

                <nav className="flex flex-col gap-1.5 pt-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold ${
                        currentAdminTab === item.id ? "bg-on-surface text-white" : "text-[#001943] hover:bg-white/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#001943]/10">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-full bg-on-surface text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Déconnexion</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Dynamic Content View Container */}
        <main className="min-w-0 flex-1 p-3 sm:p-5 max-w-7xl w-full mx-auto">
          {currentAdminTab === "dashboard" && (
            <DashboardView
              overview={overview}
              recentPayments={payments}
              users={users}
              groups={groups}
              fiches={fiches}
              adminName={currentUser?.name}
              onOpenCreateFiche={() => handleNavigate("fiches")}
              onOpenRecordPayment={() => setIsPaymentModalOpen(true)}
              onOpenFicheDetail={(ficheId) => {
                setActiveFicheId(ficheId);
                handleNavigate("fiche_detail");
              }}
              onNavigateToView={(view) => handleNavigate(view)}
              onShowToast={showToast}
            />
          )}

          {currentAdminTab === "members" && (
            <AdminMembersPage
              users={users}
              groups={groups}
              onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
              onUpdateMemberPin={handleUpdateMemberPin}
              onUpdateMember={handleUpdateMember}
              onShowToast={showToast}
            />
          )}

          {currentAdminTab === "groups" && (
            <GroupsView
              groups={groups}
              users={users}
              fiches={fiches}
              onOpenFicheDetail={(ficheId) => {
                setActiveFicheId(ficheId);
                handleNavigate("fiche_detail");
              }}
              onCreateGroup={handleCreateGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onAddMemberToGroup={handleAddMemberToGroup}
              onRemoveMemberFromGroup={handleRemoveMemberFromGroup}
              onShowToast={showToast}
            />
          )}

          {currentAdminTab === "fiches" && (
            <FichesView
              fiches={fiches}
              groups={groups}
              users={users}
              payments={payments}
              onOpenFicheDetail={(ficheId) => {
                setActiveFicheId(ficheId);
                handleNavigate("fiche_detail");
              }}
              onCreateFiche={handleCreateFiche}
              onUpdateFiche={handleUpdateFiche}
              onOpenArchives={() => handleNavigate("fiches_archives")}
              onShowToast={showToast}
            />
          )}

          {currentAdminTab === "fiches_archives" && (
            <FichesArchiveView
              fiches={fiches}
              groups={groups}
              onBack={() => handleNavigate("fiches")}
              onOpenFicheDetail={(ficheId) => {
                setActiveFicheId(ficheId);
                handleNavigate("fiche_detail");
              }}
              onUpdateFiche={handleUpdateFiche}
              onShowToast={showToast}
            />
          )}

          {currentAdminTab === "fiche_detail" && (
            <FicheDetailView
              fiche={activeFiche}
              records={activeRecords}
              users={users}
              onBack={() => handleNavigate("fiches")}
              onRecordPayment={handleRecordPayment}
              onUseCredit={handleUseCredit}
              onShowToast={showToast}
            />
          )}

          {currentAdminTab === "versements" && (
            <VersementsView
              users={users}
              fiches={fiches}
              records={records}
              onUseCredit={handleUseCredit}
              onShowToast={showToast}
            />
          )}

          {currentAdminTab === "depenses" && (
            <DepensesView depenses={depenses} overview={overview} onAddDepense={handleAddDepense} onShowToast={showToast} />
          )}

          {currentAdminTab === "collectes" && <CollectesView onShowToast={showToast} />}

          {currentAdminTab === "settings" && <AdminSettingsView onShowToast={showToast} onResetData={handleResetData} />}

          {currentAdminTab === "admins" &&
            (currentUser?.is_principal && currentUser.id ? (
              <AdminsView currentAdminId={currentUser.id} onShowToast={showToast} />
            ) : (
              <div className="bg-white rounded-[24px] p-6 border border-[#eceef3] text-center text-sm text-[#464554]">
                Cette page est réservée à l'administrateur principal.
              </div>
            ))}

          {currentAdminTab === "portal" && (
            <AdminPortalSettingsView fiches={fiches} onRefreshFiches={refreshData} onShowToast={showToast} />
          )}
        </main>
      </div>
    </div>
  );
};
