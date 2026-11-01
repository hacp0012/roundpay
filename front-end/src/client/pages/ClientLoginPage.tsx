import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/authContext";
import { RoundPayLogo } from "../../components/common/RoundPayLogo";
import { PWAInstallButton } from "../../components/common/PWAInstallButton";
import { APP_NAME } from "../../config/branding";
import { OfflineIndicator } from "../../components/common/OfflineIndicator";
import { Button, Card, Input, Label, Select, Spinner } from "../../components/ui";
import { formatMoney } from "../../config/currency";

export const ClientLoginPage: React.FC = () => {
  const { loginClient, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [countryCode, setCountryCode] = useState("+243");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/client/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullPhone = phoneNumber.startsWith("+") ? phoneNumber.trim() : `${countryCode} ${phoneNumber.trim()}`;
    if (!phoneNumber.trim()) {
      setErrorMessage("Veuillez saisir votre numéro de téléphone.");
      return;
    }

    if (!pin.trim()) {
      setErrorMessage("Veuillez saisir votre code PIN à 4 chiffres.");
      return;
    }

    setIsSubmitting(true);
    const res = await loginClient(fullPhone, pin);
    setIsSubmitting(false);

    if (res.success) {
      navigate("/client/dashboard");
    } else {
      setErrorMessage(res.error || "Identifiants incorrects.");
    }
  };

  const handleQuickFill = (phone: string, demoPin: string) => {
    setPhoneNumber(phone);
    setPin(demoPin);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fe] text-[#181c20] flex flex-col justify-between py-6 px-4 relative overflow-hidden">
      <OfflineIndicator />

      {/* Top Bar with PWA install & Admin Link */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-2">
        <RoundPayLogo size="sm" />
        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <Link
            to="/admin/login"
            id="link-admin-login"
            className="flex items-center gap-1 text-xs font-bold text-[#464554] hover:text-primary px-3 py-1.5 rounded-full bg-white shadow-xs border border-[#e0e2e7] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            <span className="hidden sm:inline">Espace Trésorier</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Login Card - Mobile optimized */}
      <main className="w-full max-w-md mx-auto my-auto py-6 z-10">
        <Card className="rounded-[32px] p-5 sm:p-6 shadow-xl shadow-secondary-container/10">
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-3xl bg-[#111418] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#111418]/20">
              <span className="material-symbols-outlined text-[28px] text-secondary-container">account_circle</span>
            </div>
            <h1 className="font-sora text-2xl font-bold text-[#181c20]">Espace Membre</h1>
            <p className="text-xs text-[#777585] mt-1">
              Connectez-vous pour consulter vos cotisations et effectuer vos versements
            </p>
          </div>

          {/* Error notification banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs animate-shake">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="input-client-phone">Numéro de téléphone</Label>
              <div className="flex gap-2 mt-1.5">
                <Select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="!w-[8.75rem] shrink-0 font-bold rounded-2xl px-3 py-3"
                >
                  <option value="+243">+243 (RDC)</option>
                  <option value="+221">+221 (Sénégal)</option>
                  <option value="+225">+225 (Côte d'Ivoire)</option>
                  <option value="+223">+223 (Mali)</option>
                  <option value="+33">+33 (France)</option>
                  <option value="+212">+212 (Maroc)</option>
                </Select>
                <Input
                  type="tel"
                  id="input-client-phone"
                  required
                  placeholder="Ex: 82 54 11 092"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="min-w-0 !flex-1 !w-auto px-4 py-3 rounded-2xl font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="input-client-pin" className="mb-0">
                  Code PIN personnel
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-[#777585] hover:text-primary px-1 py-0"
                >
                  <span className="material-symbols-outlined text-[14px]">{showPin ? "visibility_off" : "visibility"}</span>
                  <span>{showPin ? "Masquer" : "Afficher"}</span>
                </Button>
              </div>
              <Input
                type={showPin ? "text" : "password"}
                id="input-client-pin"
                required
                // maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="px-4 py-3 rounded-2xl text-base font-mono font-bold text-center tracking-[0.3em]"
              />
            </div>

            <Button
              type="submit"
              id="btn-client-login"
              disabled={isSubmitting}
              size="lg"
              className="w-full py-3.5 mt-2 rounded-2xl shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 border-white/40 border-t-white" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Accéder à mon espace</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </Button>
          </form>

          {/* Strict Platform Policy Note (No registration) */}
          <div className="mt-6 pt-5 border-t border-[#eceef3] text-center">
            <div className="p-3 bg-[#f7f9fe] rounded-2xl border border-[#e0e2e7]/80 text-left flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">info</span>
              <p className="text-[11px] text-[#464554] leading-relaxed">
                <strong>Pas d'inscription publique :</strong> L'accès est strictement réservé aux membres ajoutés par
                l'administrateur de votre tontine ou collectif. Contactez votre trésorier pour obtenir votre code PIN.
              </p>
            </div>
          </div>

          {/* Quick Demo Accounts Helper for Easy Evaluation */}
          <div className="mt-6 pt-4 border-t border-dashed border-[#eceef3]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777585] block text-center mb-2">
              Comptes Démo (Test Rapide 1-Clic)
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickFill("+243 82 54 11 092", "1234")}
                className="p-2 rounded-xl bg-[#f7f9fe] hover:bg-secondary-container/20 border border-[#e0e2e7] transition-all text-left"
              >
                <div className="text-[11px] font-bold text-[#181c20]">Amadou Diallo</div>
                <div className="text-[10px] text-emerald-700 font-medium">+{formatMoney(50)} avance</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("+221 77 34 22 819", "1234")}
                className="p-2 rounded-xl bg-[#f7f9fe] hover:bg-secondary-container/20 border border-[#e0e2e7] transition-all text-left"
              >
                <div className="text-[11px] font-bold text-[#181c20]">Céline Martin</div>
                <div className="text-[10px] text-amber-700 font-medium">Reste {formatMoney(15)}</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("+225 07 88 19 440", "1234")}
                className="p-2 rounded-xl bg-[#f7f9fe] hover:bg-secondary-container/20 border border-[#e0e2e7] transition-all text-left"
              >
                <div className="text-[11px] font-bold text-[#181c20]">Marc Leroy</div>
                <div className="text-[10px] text-red-700 font-medium">Retard {formatMoney(25)}</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("+212 66 12 34 567", "1234")}
                className="p-2 rounded-xl bg-[#f7f9fe] hover:bg-secondary-container/20 border border-[#e0e2e7] transition-all text-left"
              >
                <div className="text-[11px] font-bold text-[#181c20]">Fatima Benali</div>
                <div className="text-[10px] text-emerald-700 font-medium">+{formatMoney(75)} avance</div>
              </button>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center text-[11px] text-[#777585] z-10 py-2">
        <span>{APP_NAME} v2.0 • Plateforme de cotisations, fiches et tontines sécurisées</span>
      </footer>
    </div>
  );
};
