import React, { useEffect, useState } from 'react';
import { useAuth } from '../../services/authContext';
import { mockApi } from '../../services/mockApi';
import { AppCurrency } from '../../types';
import {
  currencyLabel,
  formatMoney,
  getAppCurrency,
  isAppCurrency,
  setAppCurrency,
  SUPPORTED_CURRENCIES,
} from '../../config/currency';
import { Button, Input, Label, Select } from '../ui';
import { MemberAvatar } from '../common/MemberAvatar';
import { APP_NAME } from '../../config/branding';

interface AdminSettingsViewProps {
  onShowToast: (msg: string) => void;
  onResetData: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  onShowToast,
  onResetData,
}) => {
  const { currentUser, setCurrentUser } = useAuth();
  const [devise, setDevise] = useState<AppCurrency>(getAppCurrency());
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [password, setPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingDevise, setIsSavingDevise] = useState(false);

  useEffect(() => {
    mockApi.getPublicSettings().then((settings) => {
      if (isAppCurrency(settings.devise)) {
        setAppCurrency(settings.devise);
        setDevise(settings.devise);
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setUsername(currentUser.username || '');
  }, [currentUser?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await mockApi.updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
      });
      setCurrentUser(updated);
      setPassword('');
      onShowToast('Profil administrateur mis à jour.');
    } catch (err) {
      console.error(err);
      onShowToast("Impossible d'enregistrer le profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveDevise = async () => {
    setIsSavingDevise(true);
    try {
      const settings = await mockApi.updatePublicSettings({ devise });
      if (isAppCurrency(settings.devise)) {
        setAppCurrency(settings.devise);
        setDevise(settings.devise);
      } else {
        setAppCurrency(devise);
      }
      onShowToast(`Devise collective définie sur ${currencyLabel(devise)}.`);
    } catch (err) {
      console.error(err);
      onShowToast('Impossible de mettre à jour la devise.');
    } finally {
      setIsSavingDevise(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-xs border border-[#eceef3] flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <MemberAvatar
            src={null}
            name={currentUser.name}
            className="w-14 h-14"
            textClassName="text-sm"
          />
          <div>
            <h1 className="font-sora text-2xl font-bold text-[#181c20]">
              Paramètres de {APP_NAME}
            </h1>
            <p className="text-xs text-[#777585] mt-1">
              Profil trésorier, devise collective (CDF / USD) et options techniques.
              Aucune photo de profil n’est utilisée côté administration.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#eceef3]">
          <div className="sm:col-span-2">
            <h2 className="font-sora text-sm font-bold text-[#181c20]">Mon profil administrateur</h2>
          </div>
          <div>
            <Label htmlFor="admin-profile-name">Nom complet</Label>
            <Input id="admin-profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="admin-profile-username">Identifiant de connexion</Label>
            <Input id="admin-profile-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="admin-profile-email">Email</Label>
            <Input id="admin-profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="admin-profile-password">Nouveau mot de passe (optionnel)</Label>
            <Input
              id="admin-profile-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Laisser vide pour ne pas changer"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? 'Enregistrement…' : 'Enregistrer mon profil'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-xs border border-[#eceef3] flex flex-col gap-3">
        <div>
          <h2 className="font-sora text-base font-bold text-[#181c20]">Devise collective</h2>
          <p className="text-xs text-[#777585] mt-1">
            Devises supportées : Franc Congolais (FC / CDF) et Dollar Américain (USD).
            Exemple d’affichage : {formatMoney(25000, devise)}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Label htmlFor="admin-devise">Devise active</Label>
            <Select
              id="admin-devise"
              value={devise}
              onChange={(e) => setDevise(e.target.value as AppCurrency)}
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {currencyLabel(code)}
                </option>
              ))}
            </Select>
          </div>
          <Button type="button" onClick={handleSaveDevise} disabled={isSavingDevise}>
            {isSavingDevise ? 'Enregistrement…' : 'Appliquer la devise'}
          </Button>
        </div>

        <div className="p-4 bg-[#f7f9fe] rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-[#181c20] block">Passerelles Mobile Money</span>
            <span className="text-[#777585]">Orange Money, M-Pesa, Airtel, Wave, MTN</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
            5 Actives
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-xs border border-[#eceef3] flex items-center justify-between gap-3">
        <div>
          <span className="font-bold text-xs text-[#181c20] block">Zone technique</span>
          <span className="text-[11px] text-[#777585]">Réinitialisation démo non disponible en base distante.</span>
        </div>
        <button
          type="button"
          onClick={onResetData}
          className="px-4 py-2 rounded-full border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
        >
          Réinitialiser les données démo
        </button>
      </div>
    </div>
  );
};
