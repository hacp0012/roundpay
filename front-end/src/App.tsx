import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./services/authContext";
import { mockApi } from "./services/mockApi";
import { isAppCurrency, setAppCurrency } from "./config/currency";

const ClientLoginPage = lazy(() =>
  import("./client/pages/ClientLoginPage").then((module) => ({ default: module.ClientLoginPage })),
);
const AdminLoginPage = lazy(() =>
  import("./admin/pages/AdminLoginPage").then((module) => ({ default: module.AdminLoginPage })),
);
const ClientLayout = lazy(() => import("./client/layouts/ClientLayout").then((module) => ({ default: module.ClientLayout })));
const ClientDashboardPage = lazy(() =>
  import("./client/pages/ClientDashboardPage").then((module) => ({ default: module.ClientDashboardPage })),
);
const ClientProfilePage = lazy(() =>
  import("./client/pages/ClientProfilePage").then((module) => ({ default: module.ClientProfilePage })),
);
const ClientAccountPage = lazy(() =>
  import("./client/pages/ClientAccountPage").then((module) => ({ default: module.ClientAccountPage })),
);
const ClientHistoryPage = lazy(() =>
  import("./client/pages/ClientHistoryPage").then((module) => ({ default: module.ClientHistoryPage })),
);
const ClientAboutPage = lazy(() =>
  import("./client/pages/ClientAboutPage").then((module) => ({ default: module.ClientAboutPage })),
);
const AdminLayout = lazy(() => import("./admin/layouts/AdminLayout").then((module) => ({ default: module.AdminLayout })));
const PublicLayout = lazy(() => import("./public/layouts/PublicLayout").then((module) => ({ default: module.PublicLayout })));
const PublicHomePage = lazy(() =>
  import("./public/pages/PublicHomePage").then((module) => ({ default: module.PublicHomePage })),
);
const PublicContactPage = lazy(() =>
  import("./public/pages/PublicContactPage").then((module) => ({ default: module.PublicContactPage })),
);
const PublicFicheDetailPage = lazy(() =>
  import("./public/pages/PublicFicheDetailPage").then((module) => ({ default: module.PublicFicheDetailPage })),
);
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

export default function App() {
  const [, setCurrencyRevision] = useState(0);

  useEffect(() => {
    mockApi
      .getPublicSettings()
      .then((settings) => {
        if (isAppCurrency(settings.devise)) {
          setAppCurrency(settings.devise);
          setCurrencyRevision((revision) => revision + 1);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#f7f9fe] flex items-center justify-center text-sm font-semibold text-[#464554]">
              Chargement...
            </div>
          }
        >
          <Routes>
            {/* Public Portal (Accessible without authentication) */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<PublicHomePage />} />
              <Route path="contact" element={<PublicContactPage />} />
              <Route path="fiche/:id" element={<PublicFicheDetailPage />} />
            </Route>

            {/* Client / Contributor Login (Phone & PIN) */}
            <Route path="/login" element={<ClientLoginPage />} />

            {/* Admin Login (Username & Password) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Client Space (Mobile-first dashboard) */}
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<Navigate to="/client/dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboardPage />} />
              <Route path="profil" element={<ClientProfilePage />} />
              <Route path="profil/compte" element={<ClientAccountPage />} />
              <Route path="profil/historique" element={<ClientHistoryPage />} />
              <Route path="profil/apropos" element={<ClientAboutPage />} />
            </Route>

            {/* Admin Space */}
            <Route path="/admin" element={<AdminLayout />} />
            <Route path="/admin/*" element={<AdminLayout />} />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
