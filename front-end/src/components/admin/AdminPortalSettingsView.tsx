import React, { useState, useEffect } from 'react';
import { mockApi } from '../../services/mockApi';
import { ContactMessageItem, FicheContribution, PublicPortalSettings } from '../../types';
import { Button, Checkbox, Spinner } from '../ui';

interface AdminPortalSettingsViewProps {
  fiches: FicheContribution[];
  onRefreshFiches: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const AdminPortalSettingsView: React.FC<AdminPortalSettingsViewProps> = ({
  fiches,
  onRefreshFiches,
  onShowToast,
}) => {
  const [settings, setSettings] = useState<PublicPortalSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'contact_about' | 'fiches_visibility' | 'messages'>('contact_about');
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSendReply = async (item: ContactMessageItem) => {
    if (!replyDraft.trim()) {
      onShowToast('Veuillez écrire votre réponse.');
      return;
    }
    setIsSendingReply(true);
    try {
      const result = await mockApi.replyToContactMessage(item.id, replyDraft.trim());
      onShowToast(`Réponse envoyée à ${result.email}.`);
      setReplyingToId(null);
      setReplyDraft('');
      await loadContactMessages();
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Impossible d'envoyer la réponse.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const loadContactMessages = async () => {
    setIsLoadingMessages(true);
    try {
      setContactMessages(await mockApi.getContactMessages());
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Impossible de charger les messages.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      void loadContactMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFicheId, setEditingFicheId] = useState<string | null>(null);
  const [ficheDescriptionDraft, setFicheDescriptionDraft] = useState('');

  useEffect(() => {
    mockApi.getPublicSettings().then(setSettings);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await mockApi.updatePublicSettings(settings);
      onShowToast("Paramètres du portail public et coordonnées mis à jour avec succès !");
    } catch (err: any) {
      onShowToast(err.message || "Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFichePublic = async (ficheId: string, currentPublicState: boolean) => {
    try {
      await mockApi.toggleFichePublicStatus(ficheId, !currentPublicState);
      await onRefreshFiches();
      onShowToast(
        !currentPublicState
          ? "Fiche publiée sur le portail public (accessible sans connexion)"
          : "Fiche retirée du portail public"
      );
    } catch (err) {
      onShowToast("Erreur lors de la modification de visibilité.");
    }
  };

  const handleSaveFicheDescription = async (ficheId: string) => {
    try {
      await mockApi.updateFiche(ficheId, { description: ficheDescriptionDraft });
      await onRefreshFiches();
      setEditingFicheId(null);
      onShowToast("Présentation explicative de la fiche enregistrée !");
    } catch (err) {
      onShowToast("Erreur lors de l'enregistrement de la description.");
    }
  };

  if (!settings) {
    return (
      <div className="py-12 flex justify-center items-center">
        <Spinner className="w-8 h-8 border-3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sora text-2xl font-bold text-[#181c20]">
            Portail Public & Page Contact
          </h1>
          <p className="text-xs text-[#777585] mt-1">
            Gérez les informations de la page Contact, le texte "À propos" et la visibilité publique des fiches de collecte.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#e0e2e7] bg-white hover:bg-[#f7f9fe] text-xs font-bold text-[#181c20] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Voir le portail public</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#eceef3] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('contact_about')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'contact_about'
              ? 'bg-primary text-white shadow-xs'
              : 'text-[#777585] hover:text-[#181c20] bg-white'
          }`}
        >
          Coordonnées & "À propos de nous"
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fiches_visibility')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'fiches_visibility'
              ? 'bg-primary text-white shadow-xs'
              : 'text-[#777585] hover:text-[#181c20] bg-white'
          }`}
        >
          Fiches Publiques & Présentation ({fiches.filter((f) => f.is_public).length} publiées)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'messages'
              ? 'bg-primary text-white shadow-xs'
              : 'text-[#777585] hover:text-[#181c20] bg-white'
          }`}
        >
          Messages reçus
        </button>
      </div>

      {activeTab === 'messages' ? (
        <section className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#eceef3] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#eceef3]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
              <h2 className="font-sora text-base font-bold text-[#181c20]">Messages envoyés depuis /contact</h2>
            </div>
            <Button type="button" onClick={() => void loadContactMessages()} disabled={isLoadingMessages}>
              {isLoadingMessages ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>

          {!isLoadingMessages && contactMessages.length === 0 && (
            <p className="text-xs text-[#777585]">Aucun message reçu pour le moment.</p>
          )}

          {contactMessages.map((item) => (
            <div key={item.id} className="border border-[#eceef3] rounded-2xl p-4 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#181c20]">{item.nom}</span>
                <span className="text-[#777585]">{item.created_at}</span>
              </div>
              <span className="text-[#777585]">
                {item.objet}
                {item.contact ? ` · ${item.contact}` : ''}
              </span>
              <p className="text-[#181c20] whitespace-pre-line leading-relaxed">{item.message}</p>

              {item.replied_at && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex flex-col gap-1">
                  <span className="font-bold text-emerald-800">Réponse envoyée le {item.replied_at}</span>
                  <p className="text-[#181c20] whitespace-pre-line">{item.reply_message}</p>
                </div>
              )}

              {item.email ? (
                replyingToId === item.id ? (
                  <div className="flex flex-col gap-2 pt-2">
                    <textarea
                      aria-label={`Réponse à ${item.nom}`}
                      rows={4}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder={`Votre réponse sera envoyée à ${item.email}`}
                      className="w-full px-3.5 py-2 bg-[#f7f9fe] border border-[#e0e2e7] rounded-xl text-sm focus:outline-none focus:border-primary text-[#181c20] resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyDraft('');
                        }}
                        disabled={isSendingReply}
                      >
                        Annuler
                      </Button>
                      <Button type="button" onClick={() => void handleSendReply(item)} disabled={isSendingReply}>
                        {isSendingReply ? 'Envoi...' : `Envoyer à ${item.email}`}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      onClick={() => {
                        setReplyingToId(item.id);
                        setReplyDraft('');
                      }}
                    >
                      {item.replied_at ? 'Répondre à nouveau' : 'Répondre par e-mail'}
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-[11px] text-[#777585] italic">
                  Pas d'adresse e-mail valide fournie : réponse par e-mail impossible.
                </p>
              )}
            </div>
          ))}
        </section>
      ) : activeTab === 'contact_about' ? (
        /* Form for Contact and About Us */
        <form onSubmit={handleSaveSettings} className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#eceef3] shadow-xs flex flex-col gap-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#eceef3]">
            <span className="material-symbols-outlined text-primary text-[20px]">contact_support</span>
            <h2 className="font-sora text-base font-bold text-[#181c20]">
              Informations affichées sur /contact
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Nom officiel du collectif / Association
              </label>
              <input
                type="text"
                value={settings.nom_collectif}
                onChange={(e) => setSettings({ ...settings, nom_collectif: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Slogan ou sous-titre
              </label>
              <input
                type="text"
                value={settings.slogan}
                onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Texte "À propos de nous" (Présentation du collectif pour les visiteurs)
              </label>
              <textarea
                rows={4}
                value={settings.about_us}
                onChange={(e) => setSettings({ ...settings, about_us: e.target.value })}
                placeholder="Décrivez brièvement les objectifs du collectif, l'historique et la rigueur de la gestion..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Courriel de contact public
              </label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Numéro WhatsApp officiel
              </label>
              <input
                type="text"
                value={settings.contact_whatsapp}
                onChange={(e) => setSettings({ ...settings, contact_whatsapp: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Téléphone d'accueil
              </label>
              <input
                type="text"
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Adresse physique de la permanence
              </label>
              <input
                type="text"
                value={settings.contact_adresse}
                onChange={(e) => setSettings({ ...settings, contact_adresse: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Horaires de permanence d'accueil
              </label>
              <input
                type="text"
                value={settings.contact_horaires}
                onChange={(e) => setSettings({ ...settings, contact_horaires: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-[#181c20] block mb-1">
                Message d'accueil en haut du portail public (/)
              </label>
              <textarea
                rows={2}
                value={settings.message_bienvenue}
                onChange={(e) => setSettings({ ...settings, message_bienvenue: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e0e2e7] bg-white text-[#181c20] focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#eceef3]">
            <Button
              type="submit"
              disabled={isSaving}
              size="lg"
            >
              {isSaving ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Enregistrer les coordonnées</span>
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        /* Fiches Visibility and Description Editor */
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[24px] p-5 border border-[#eceef3] text-xs text-[#464554] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">public</span>
              <span>
                Les fiches cochées <strong>"Publique"</strong> sont directement visibles sur le portail public sans nécessité de connexion.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {fiches.map((fiche) => {
              const isEditingThis = editingFicheId === fiche.id;

              return (
                <div
                  key={fiche.id}
                  className="bg-white rounded-[28px] p-6 border border-[#eceef3] shadow-xs flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        {fiche.code}
                      </span>
                      <h3 className="font-sora text-base font-bold text-[#181c20]">
                        {fiche.titre}
                      </h3>
                      <span className="text-[10px] font-semibold text-[#777585] px-2 py-0.5 rounded-md bg-[#f1f4f9]">
                        {fiche.type === 'libre' ? 'Collecte libre' : 'Cotisation obligatoire'}
                      </span>
                    </div>

                    {/* Public Visibility Toggle */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={!!fiche.is_public}
                        onChange={() => handleToggleFichePublic(fiche.id, !!fiche.is_public)}
                        label={
                          <span className={`text-xs font-bold ${fiche.is_public ? 'text-emerald-700' : 'text-[#777585]'}`}>
                            {fiche.is_public ? 'Publiée sur le portail' : 'Privée aux membres'}
                          </span>
                        }
                      />
                    </div>
                  </div>

                  {/* Explicative Description Viewer / Editor */}
                  {isEditingThis ? (
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#f7f9fe] border border-[#eceef3]">
                      <label className="text-[11px] font-bold text-[#181c20]">
                        Présentation explicative de la fiche (informe le contributeur sur la raison de sa contribution)
                      </label>
                      <textarea
                        rows={4}
                        value={ficheDescriptionDraft}
                        onChange={(e) => setFicheDescriptionDraft(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[#e0e2e7] bg-white text-xs text-[#181c20] focus:outline-none focus:border-primary"
                        placeholder="Expliquez en détail pourquoi cette cotisation a lieu, son impact, et comment les fonds seront gérés..."
                      />
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingFicheId(null)}
                          className="px-3 py-1.5 rounded-full border border-[#e0e2e7] text-xs font-semibold text-[#777585] hover:bg-white"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveFicheDescription(fiche.id)}
                          className="px-4 py-1.5 rounded-full bg-action text-white text-xs font-bold hover:bg-action-hover"
                        >
                          Enregistrer la description
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#f7f9fe] border border-[#eceef3] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#777585] uppercase tracking-wider">
                          Présentation explicative pour les contributeurs
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFicheId(fiche.id);
                            setFicheDescriptionDraft(fiche.description || fiche.motif || '');
                          }}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Modifier l'explication</span>
                        </button>
                      </div>
                      <p className="text-xs text-[#464554] leading-relaxed">
                        {fiche.description || (
                          <span className="italic text-[#777585]">
                            Aucune présentation détaillée personnalisée. Le motif sera affiché par défaut : "{fiche.motif}"
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
