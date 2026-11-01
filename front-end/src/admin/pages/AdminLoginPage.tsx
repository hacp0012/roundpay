import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../services/authContext';
import { RoundPayLogo } from '../../components/common/RoundPayLogo';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { APP_NAME } from '../../config/branding';
import { Button, Input, Label, Spinner } from '../../components/ui';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated as admin, go straight to dashboard
  React.useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage("Veuillez saisir votre identifiant administrateur.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Veuillez saisir votre mot de passe.");
      return;
    }

    setIsSubmitting(true);
    const res = await loginAdmin(username, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setErrorMessage(res.error || "Identifiants administrateur incorrects.");
    }
  };

  const handleQuickFillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#111418] text-white flex flex-col justify-between py-6 px-4 relative overflow-hidden">
      <OfflineIndicator />

      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-2">
        <RoundPayLogo size="sm" />
        <Link
          to="/login"
          id="link-return-client-login"
          className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-all border border-white/10"
        >
          <span className="material-symbols-outlined text-[16px]">person</span>
          <span>Espace Membre</span>
        </Link>
      </header>

      {/* Main Admin Box */}
      <main className="w-full max-w-md mx-auto my-auto py-6 z-10">
        <div className="bg-[#181c20] rounded-[32px] p-5 sm:p-6 shadow-2xl">
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-3xl bg-primary text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-[28px]">
                shield_person
              </span>
            </div>
            <h1 className="font-sora text-2xl font-bold text-white">
              Espace Administrateur
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Gestion de la trésorerie, création des membres, fiches et versements
            </p>
          </div>

          {/* Error message banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800 rounded-2xl flex items-start gap-2.5 text-red-200 text-xs">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-400">
                error
              </span>
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="input-admin-username" tone="dark">
                Identifiant ou Email Trésorier
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  id="input-admin-username"
                  tone="dark"
                  required
                  autoComplete="username"
                  placeholder="admin ou sophie"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="px-4 py-3 rounded-2xl font-semibold"
                />
                <span className="material-symbols-outlined absolute right-3.5 top-3 text-white/40 text-[18px]">
                  badge
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="input-admin-password" tone="dark" className="mb-0">
                  Mot de passe
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-white/50 hover:text-white hover:bg-white/10 px-1 py-0"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                  <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
                </Button>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                id="input-admin-password"
                tone="dark"
                required
                autoComplete="current-password"
                placeholder="Mot de passe confidentiel"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 rounded-2xl font-semibold"
              />
            </div>

            <Button
              type="submit"
              id="btn-admin-submit-login"
              disabled={isSubmitting}
              size="lg"
              className="w-full py-3.5 mt-3 rounded-2xl shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="border-white/40 border-t-white" />
                  <span>Vérification sécurisée...</span>
                </>
              ) : (
                <>
                  <span>Connexion Administration</span>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials 1-Click */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <button
              type="button"
              id="btn-demo-admin-fill"
              onClick={handleQuickFillAdmin}
              className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-secondary-container">
                  Remplir avec l'administrateur démo
                </div>
                <div className="text-[11px] text-white/50">
                  Sophie M. • Trésorière Générale (admin / admin123)
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary-container group-hover:translate-x-0.5 transition-transform">
                bolt
              </span>
            </button>
          </div>

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Retour à l'espace de connexion Membre</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center text-[11px] text-white/40 z-10 py-2">
        <span>Accès réservé au Bureau Exécutif & Trésoriers de {APP_NAME}</span>
      </footer>
    </div>
  );
};
