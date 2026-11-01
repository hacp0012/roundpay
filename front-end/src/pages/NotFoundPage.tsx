import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RoundPayLogo } from '../components/common/RoundPayLogo';
import { APP_NAME } from '../config/branding';
import { Badge, Button, Card, IconButton } from '../components/ui';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f9fe] text-[#181c20] flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#eceef3]">
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <RoundPayLogo size="sm" />
          </Link>
          <IconButton
            label="Retour à l'accueil"
            icon="home"
            onClick={() => navigate('/')}
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center flex flex-col items-center gap-4">
          <Badge tone="neutral">Erreur 404</Badge>
          <div className="w-16 h-16 rounded-3xl bg-action text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">search_off</span>
          </div>
          <div>
            <h1 className="font-sora text-xl font-bold text-[#181c20]">
              Page introuvable
            </h1>
            <p className="text-xs text-[#777585] mt-1.5 leading-relaxed">
              Cette adresse n'existe pas sur {APP_NAME}. Vérifiez le lien ou
              revenez à l'accueil pour continuer.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-1">
            <Button className="w-full sm:flex-1" size="lg" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
            <Link
              to="/contact"
              className="w-full sm:flex-1 py-3 text-center text-xs font-bold text-primary hover:text-primary-container transition-colors"
            >
              Contacter le secrétariat
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
};
